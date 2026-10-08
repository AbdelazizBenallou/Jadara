import { AppError } from "../../../framework/utils/AppError.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { storage } from "../../../framework/utils/storage.js";
import {
  applicationsRepository,
  type ApplicationRow,
  type ApplicationStatusFilter,
} from "./applications.repository.js";
import { activitiesRepository } from "../volunteering-activities/activities.repository.js";
import type {
  CompletedQueryInput,
  ListApplicationsInput,
  ListMyApplicationsInput,
} from "./applications.validation.js";

const ADMIN_ROLE = "Admin";
const BENEFICIARY_ROLE = "Beneficiary";

type SkillBrief = { id: number; name: string };

/**
 * Deterministic skill match between the activity's required skills and the
 * applicant's. percentage = round(matched / total * 100), null when the
 * activity has no required skills.
 */
function computeSkillMatch(
  required: SkillBrief[],
  applicantSkillIds: Set<number>,
): { matched_skills: SkillBrief[]; missing_skills: SkillBrief[]; percentage: number | null } {
  if (required.length === 0) {
    return { matched_skills: [], missing_skills: [], percentage: null };
  }
  const matched = required.filter((s) => applicantSkillIds.has(s.id));
  const missing = required.filter((s) => !applicantSkillIds.has(s.id));
  const percentage = Math.round((matched.length / required.length) * 100);
  return { matched_skills: matched, missing_skills: missing, percentage };
}

async function avatarUrl(avatar: string | null): Promise<string | null> {
  if (!avatar) return null;
  return storage.getPresignedUrl(BUCKETS.avatars, avatar);
}

function mapMine(
  row: Awaited<ReturnType<typeof applicationsRepository.listMine>>[number],
) {
  const a = row.activity;
  return {
    id: row.id,
    activity_id: row.activity_id,
    status: row.status,
    application_date: row.application_date,
    activity: {
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      start_date: a.start_date,
      end_date: a.end_date,
      capacity: a.required_volunteers,
      registration_deadline: a.registration_deadline,
      organization: a.organization,
      required_skills: a.required_skills.map((link) => link.skill),
    },
  };
}

async function mapForOrg(row: ApplicationRow) {
  const user = row.user;
  const profile = user.profiles;
  const skills = user.user_skills.map((link) => ({
    id: link.skills.id,
    name: link.skills.name,
    level: link.level,
  }));
  return {
    id: row.id,
    activity_id: row.activity_id,
    status: row.status,
    application_date: row.application_date,
    skill_match: computeSkillMatch(
      row.activity.required_skills.map((link) => link.skill),
      new Set(user.user_skills.map((link) => link.skills.id)),
    ),
    applicant: {
      id: user.id,
      email: user.email,
      status: user.status,
      profile: profile
        ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar: await avatarUrl(profile.avatar),
            bio: profile.bio,
            location: profile.location,
          }
        : null,
      skills,
      education: user.educations.map((e) => ({
        school: e.school,
        degree: e.degree,
        field_of_study: e.field_of_study,
      })),
      work_experience: user.work_experiences.map((w) => ({
        company: w.company,
        job_title: w.job_title,
      })),
    },
  };
}

async function mapParticipant(
  row: Awaited<ReturnType<typeof applicationsRepository.listAcceptedParticipants>>[number],
  requiredSkillIds: Set<number>,
) {
  const user = row.user;
  const profile = user.profiles;
  return {
    id: user.id,
    name: profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : null,
    avatar: await avatarUrl(profile?.avatar ?? null),
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    skills: user.user_skills
      .filter((link) => requiredSkillIds.has(link.skills.id))
      .map((link) => link.skills.name),
  };
}

/**
 * Loads an activity and enforces the caller running it belongs to the owning
 * organization. Admin bypasses ownership. Non-owners get 404 so activity IDs
 * cannot be enumerated.
 */
async function resolveOwnedActivity(userId: number, activityId: number, role: string) {
  const activity = await activitiesRepository.findById(activityId);
  if (!activity) throw new AppError("Activity not found", 404);

  if (role === ADMIN_ROLE) return activity;

  const organization = await activitiesRepository.findOrganizationByUser(userId);
  if (!organization) throw new AppError("No organization found for this account", 403);
  if (organization.id !== activity.organization_id) {
    throw new AppError("Activity not found", 404);
  }
  return activity;
}

/** Whether a non-owner may view the activity (same rule as activity detail). */
function isPubliclyVisible(
  activity: Awaited<ReturnType<typeof activitiesRepository.findById>>,
  now: Date,
): boolean {
  if (!activity) return false;
  if (activity.status !== "published") return false;
  if (!activity.is_active) return false;
  if (activity.end_date < now) return false;
  if (activity.registration_deadline && activity.registration_deadline < now) return false;
  return true;
}

export const applicationsService = {
  /**
   * Volunteer Join: a Beneficiary applies to an open published activity.
   * user_id always comes from the verified token, never from the body.
   */
  async apply(userId: number, role: string, activityId: number) {
    const activity = await activitiesRepository.findById(activityId);
    if (!activity) throw new AppError("Activity not found", 404);

    if (activity.status !== "published" || !activity.is_active) {
      throw new AppError("Activity is not open for applications", 400);
    }

    const now = new Date();
    if (activity.registration_deadline && activity.registration_deadline < now) {
      throw new AppError("Registration deadline has passed", 400);
    }

    const accepted = await applicationsRepository.countAccepted(activity.id);
    if (accepted >= activity.required_volunteers) {
      throw new AppError("Activity is full", 400);
    }

    const existing = await applicationsRepository.findExisting(activity.id, userId);
    if (existing) {
      throw new AppError("You have already applied to this activity", 409);
    }

    if (role !== BENEFICIARY_ROLE) {
      throw new AppError("Only Beneficiaries can apply to activities", 403);
    }

    const created = await applicationsRepository.create(userId, activity.id);
    return created;
  },

  /** A Beneficiary tracks their own applications and decisions. */
  async getMine(userId: number, query: ListMyApplicationsInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const status = query.status;

    const [items, total] = await Promise.all([
      applicationsRepository.listMine(userId, status, page, limit),
      applicationsRepository.countMine(userId, status),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      applications: items.map(mapMine),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /**
   * Organization's review queue for one of its activities. Skill match is
   * computed on the fly, then `min_skill_match` and `sort=skill_match` are
   * applied before pagination. Nothing is auto-accepted.
   */
  async listForActivity(
    userId: number,
    role: string,
    activityId: number,
    query: ListApplicationsInput,
  ) {
    await resolveOwnedActivity(userId, activityId, role);

    const rows = await applicationsRepository.listByActivity(activityId, query.status);

    const mapped = await Promise.all(rows.map(mapForOrg));

    let filtered = mapped;
    if (query.min_skill_match !== undefined) {
      filtered = filtered.filter(
        (app) => app.skill_match?.percentage !== null &&
          (app.skill_match?.percentage ?? 0) >= query.min_skill_match!,
      );
    }

    if (query.sort === "skill_match") {
      filtered.sort(
        (a, b) => (b.skill_match?.percentage ?? -1) - (a.skill_match?.percentage ?? -1),
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const data = filtered.slice((page - 1) * limit, page * limit);

    return {
      applications: data,
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /** PENDING -> ACCEPTED, with capacity check. Organization owner / Admin. */
  async accept(userId: number, role: string, applicationId: number) {
    const app = await applicationsRepository.findById(applicationId);
    if (!app) throw new AppError("Application not found", 404);
    await resolveOwnedActivity(userId, app.activity_id, role);

    if (app.status !== "pending") {
      throw new AppError("Only pending applications can be accepted", 400);
    }

    const accepted = await applicationsRepository.countAccepted(app.activity_id);
    if (accepted >= app.activity.required_volunteers) {
      throw new AppError("Activity is full", 400);
    }

    const updated = await applicationsRepository.updateStatus(app.id, "accepted");
    return mapForOrg(updated);
  },

  /** PENDING -> REJECTED. Organization owner / Admin. */
  async reject(userId: number, role: string, applicationId: number) {
    const app = await applicationsRepository.findById(applicationId);
    if (!app) throw new AppError("Application not found", 404);
    await resolveOwnedActivity(userId, app.activity_id, role);

    if (app.status !== "pending") {
      throw new AppError("Only pending applications can be rejected", 400);
    }

    const updated = await applicationsRepository.updateStatus(app.id, "rejected");
    return mapForOrg(updated);
  },

  /** Accepted volunteers of a visible activity, public info only. */
  async participants(userId: number, role: string, activityId: number) {
    const activity = await activitiesRepository.findById(activityId);
    if (!activity) throw new AppError("Activity not found", 404);

    const isOwner =
      role === ADMIN_ROLE
        ? true
        : (await activitiesRepository.findOrganizationByUser(userId))?.id === activity.organization_id;

    if (!isOwner && !isPubliclyVisible(activity, new Date())) {
      throw new AppError("Activity not found", 404);
    }

    const rows = await applicationsRepository.listAcceptedParticipants(activity.id);
    const requiredSkillIds = new Set(activity.required_skills.map((link) => link.skill.id));

    return Promise.all(rows.map((row) => mapParticipant(row, requiredSkillIds)));
  },

  /**
   * Completion: the Organization confirms an ACCEPTED volunteer actually
   * participated. ACCEPTED != COMPLETED. user_id/activity_id/organization_id
   * come from the application record, never from the request body. Runs in a
   * single transaction with the completed-volunteering record creation.
   */
  async complete(userId: number, role: string, applicationId: number) {
    const app = await applicationsRepository.findById(applicationId);
    if (!app) throw new AppError("Application not found", 404);
    await resolveOwnedActivity(userId, app.activity_id, role);

    if (app.status !== "accepted") {
      throw new AppError("Only accepted applications can be completed", 400);
    }

    if (app.activity.end_date >= new Date()) {
      throw new AppError("Activity has not finished yet", 400);
    }

    const updated = await applicationsRepository.completeAndCreateExperience(app.id);
    if (!updated) throw new AppError("Application not found", 404);
    return mapForOrg(updated);
  },

  /** The volunteer's own completed volunteering experiences (CV source). */
  async listCompleted(
    userId: number,
    query: CompletedQueryInput,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const [items, total] = await Promise.all([
      applicationsRepository.listCompleted(userId, page, limit),
      applicationsRepository.countCompleted(userId),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      applications: items.map((row) => ({
        id: row.id,
        activity: row.activity,
        organization: row.organization,
        completed_at: row.completed_at,
      })),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },
};