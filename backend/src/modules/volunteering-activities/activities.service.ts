import { AppError } from "../../../framework/utils/AppError.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { storage } from "../../../framework/utils/storage.js";
import { activitiesRepository, type ActivityWithRelations } from "./activities.repository.js";
import type {
  CreateActivityInput,
  ListActivitiesInput,
  ListPublishedActivitiesInput,
  UpdateActivityInput,
} from "./activities.validation.js";

const ADMIN_ROLE = "Admin";

export type ActivityView = ReturnType<typeof mapActivity>;
export type ActivityPublicView = ReturnType<typeof mapPublicActivity>;

function mapActivity(a: ActivityWithRelations) {
  const doc = a.documents[0] ?? null;
  return {
    id: a.id,
    organization_id: a.organization_id,
    organization: a.organization
      ? { id: a.organization.id, name: a.organization.name }
      : null,
    category_id: a.category_id,
    category: a.category ? { id: a.category.id, name: a.category.name } : null,
    title: a.title,
    description: a.description,
    location: a.location,
    start_date: a.start_date,
    end_date: a.end_date,
    capacity: a.required_volunteers,
    required_volunteers: a.required_volunteers,
    requirements: a.requirements,
    registration_deadline: a.registration_deadline,
    status: a.status,
    is_active: a.is_active,
    created_at: a.created_at,
    updated_at: a.updated_at,
    approved_by: a.approved_by,
    approver: a.approver,
    review_note: a.review_note,
    required_skills: a.required_skills.map((link) => ({
      id: link.skill.id,
      name: link.skill.name,
      description: link.skill.description,
    })),
    authorization_file: doc
      ? {
        id: doc.id,
        name: doc.name,
        file_url: doc.file_url,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
      }
      : null,
  };
}

/**
 * Public projection for the published feed and for non-owner detail views.
 * Same shape as mapActivity but without internal data: no organization_id,
 * no reviewer (approved_by/approver), no review_note, no authorization file.
 */
function mapPublicActivity(a: ActivityWithRelations) {
  return {
    id: a.id,
    organization: a.organization
      ? { id: a.organization.id, name: a.organization.name }
      : null,
    category_id: a.category_id,
    category: a.category ? { id: a.category.id, name: a.category.name } : null,
    title: a.title,
    description: a.description,
    location: a.location,
    start_date: a.start_date,
    end_date: a.end_date,
    capacity: a.required_volunteers,
    required_volunteers: a.required_volunteers,
    requirements: a.requirements,
    registration_deadline: a.registration_deadline,
    status: a.status,
    is_active: a.is_active,
    required_skills: a.required_skills.map((link) => ({
      id: link.skill.id,
      name: link.skill.name,
      description: link.skill.description,
    })),
  };
}

/**
 * Visibility rule for the public published feed and non-owner detail views:
 * the activity must be published, active (not blocked by the org), not
 * finished by date, and not past its registration deadline.
 */
function isPubliclyVisible(a: ActivityWithRelations, now: Date): boolean {
  if (a.status !== "published") return false;
  if (!a.is_active) return false;
  if (a.end_date < now) return false;
  if (a.registration_deadline && a.registration_deadline < now) return false;
  return true;
}

async function assertSkillsExist(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const existing = new Set(await activitiesRepository.findExistingSkillIds(ids));
  const missing = ids.filter((id) => !existing.has(id));
  if (missing.length > 0) {
    throw new AppError("Some selected skills do not exist.", 400, true, {
      missing_skills: missing,
    });
  }
}

async function assertCategoryExists(categoryId: number | null | undefined): Promise<void> {
  if (categoryId === null || categoryId === undefined) return;
  const category = await activitiesRepository.findCategoryById(categoryId);
  if (!category) throw new AppError("Activity category does not exist", 400);
}

/**
 * Loads an activity and enforces ownership. A caller without an organization
 * is a non-owner; a caller pointing at somebody else's activity gets 404 so
 * activity IDs cannot be enumerated across organizations. Admin bypasses the
 * ownership filter because Admin holds every permission by construction.
 */
async function resolveOwned(userId: number, activityId: number, role: string) {
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

async function load(id: number) {
  const activity = await activitiesRepository.findById(id);
  if (!activity) throw new AppError("Activity not found", 404);
  return activity;
}

export const activitiesService = {
  map: mapActivity,

  /**
   * Creates the activity in PENDING status together with its authorization
   * document. The document is mandatory, so a missing file fails before
   * anything is written to MinIO or the database.
   */
  async create(userId: number, data: CreateActivityInput, file?: Express.Multer.File) {
    if (!file) {
      throw new AppError("Authorization file is required", 400);
    }

    const skillIds = data.required_skill_ids ?? [];
    await assertSkillsExist(skillIds);
    await assertCategoryExists(data.category_id);

    // An activity always belongs to the caller's organization. Admin has no
    // organization, so Admin cannot create activities - it only reviews them.
    const organization = await activitiesRepository.findOrganizationByUser(userId);
    if (!organization) {
      throw new AppError("No organization found for this account", 403);
    }

    const uploaded = await storage.upload(BUCKETS.documents, "activities", file, userId);

    let activity: { id: number };
    try {
      activity = await activitiesRepository.createWithDocument(
        {
          organization_id: organization.id,
          category_id: data.category_id ?? null,
          title: data.title,
          description: data.description ?? null,
          location: data.location ?? null,
          start_date: data.start_date,
          end_date: data.end_date,
          required_volunteers: data.capacity,
          requirements: data.requirements ?? null,
          registration_deadline: data.registration_deadline ?? null,
        },
        skillIds,
        {
          user_id: userId,
          name: file.originalname,
          file_url: uploaded.objectName,
          file_size: uploaded.fileSize,
          mime_type: uploaded.mimeType,
        },
      );
    } catch (err) {
      // Never leave an orphaned object behind when the transaction fails.
      await storage.delete(BUCKETS.documents, uploaded.objectName);
      throw err;
    }

    return mapActivity(await load(activity.id));
  },

  /**
   * Admin and the owning organization get the full activity. Any other
   * authorized user only sees it if it is publicly visible (published,
   * active, not finished); otherwise 404 so unreviewed, blocked or finished
   * activities cannot be enumerated.
   */
  async getById(id: number, userId: number, role: string) {
    const activity = await activitiesRepository.findById(id);
    if (!activity) throw new AppError("Activity not found", 404);

    let view: ActivityView | ActivityPublicView;
    if (role === ADMIN_ROLE || (await activitiesRepository.findOrganizationByUser(userId))?.id === activity.organization_id) {
      view = mapActivity(activity);
    } else {
      if (!isPubliclyVisible(activity, new Date())) {
        throw new AppError("Activity not found", 404);
      }
      view = mapPublicActivity(activity);
    }

    // Application summary for the Volunteer Join flow.
    const [acceptedCount, myApplication] = await Promise.all([
      activitiesRepository.countAcceptedApplications(activity.id),
      activitiesRepository.findApplicationByUser(activity.id, userId),
    ]);
    return {
      ...view,
      accepted_count: acceptedCount,
      available_places: Math.max(0, activity.required_volunteers - acceptedCount),
      my_application: myApplication,
    };
  },

  async listMine(userId: number, query: ListActivitiesInput) {
    const organization = await activitiesRepository.findOrganizationByUser(userId);
    if (!organization) throw new AppError("No organization found for this account", 403);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { items, total } = await activitiesRepository.listOwned(
      { page, limit, status: query.status, q: query.q },
      organization.id,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      activities: items.map(mapActivity),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /** Admin moderation queue across all organizations. */
  async listAll(query: ListActivitiesInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { items, total } = await activitiesRepository.listAll({
      page,
      limit,
      status: query.status,
      q: query.q,
    });
    const totalPages = Math.ceil(total / limit);

    return {
      activities: items.map(mapActivity),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /** Public feed: any authorized user, only actively visible published activities. */
  async listPublished(query: ListPublishedActivitiesInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { items, total } = await activitiesRepository.listPublished({
      page,
      limit,
      now: new Date(),
      q: query.q,
      search: query.search,
      category_id: query.category_id,
      location: query.location,
      organization_id: query.organization_id,
      required_skill_id: query.required_skill_id,
      start_date: query.start_date,
      end_date: query.end_date,
    });
    const totalPages = Math.ceil(total / limit);

    return {
      activities: items.map(mapPublicActivity),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /** Org-owned / Admin: block or unblock an activity in the published feed. */
  async setActive(id: number, userId: number, role: string, is_active: boolean) {
    const activity = await resolveOwned(userId, id, role);
    if (activity.status !== "published") {
      throw new AppError(
        is_active
          ? "Only published activities can be unblocked"
          : "Only published activities can be blocked",
        400,
      );
    }

    await activitiesRepository.updateOwned(activity.id, {
      is_active,
      updated_at: new Date(),
    });

    return mapActivity(await load(activity.id));
  },

  async update(id: number, userId: number, role: string, data: UpdateActivityInput) {
    const activity = await resolveOwned(userId, id, role);
    await assertCategoryExists(data.category_id);

    // The schema can only compare the two dates when both are supplied in the
    // same request. A PATCH that moves one date must still be checked against
    // the stored one, otherwise end_date could land before start_date.
    const effectiveStart = data.start_date ?? activity.start_date;
    const effectiveEnd = data.end_date ?? activity.end_date;
    if (effectiveEnd < effectiveStart) {
      throw new AppError("Validation failed", 422, true, {
        errors: { end_date: ["end_date must be on or after start_date"] },
      });
    }

    await activitiesRepository.updateOwned(activity.id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.start_date !== undefined ? { start_date: data.start_date } : {}),
      ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
      ...(data.capacity !== undefined ? { required_volunteers: data.capacity } : {}),
      ...(data.requirements !== undefined ? { requirements: data.requirements } : {}),
      ...(data.registration_deadline !== undefined
        ? { registration_deadline: data.registration_deadline }
        : {}),
      ...(data.category_id !== undefined ? { category_id: data.category_id } : {}),
      updated_at: new Date(),
    });

    return mapActivity(await load(activity.id));
  },

  async remove(id: number, userId: number, role: string) {
    const activity = await resolveOwned(userId, id, role);
    const document = await activitiesRepository.findDocumentByActivity(activity.id);

    await activitiesRepository.deleteOwned(activity.id);
    if (document) {
      await storage.delete(BUCKETS.documents, document.file_url);
    }

    return { deleted: true };
  },

  async addSkills(id: number, userId: number, role: string, skillIds: number[]) {
    const activity = await resolveOwned(userId, id, role);
    if (skillIds.length === 0) {
      throw new AppError("At least one skill is required", 400);
    }
    await assertSkillsExist(skillIds);

    await activitiesRepository.addActivitySkills(activity.id, skillIds);
    return mapActivity(await load(activity.id));
  },

  async removeSkill(id: number, skillId: number, userId: number, role: string) {
    const activity = await resolveOwned(userId, id, role);

    const link = await activitiesRepository.findActivitySkill(activity.id, skillId);
    if (!link) {
      throw new AppError("Required skill not found for this activity", 404);
    }

    const applications = await activitiesRepository.countApplications(activity.id);
    if (applications > 0) {
      throw new AppError(
        "Required skills cannot be removed after a volunteer has joined this activity.",
        400,
      );
    }

    await activitiesRepository.deleteActivitySkill(activity.id, skillId);
    return mapActivity(await load(activity.id));
  },

  /** PENDING -> PUBLISHED. Admin only, enforced by the approve_activity gate. */
  async approve(id: number, reviewerId: number, role: string, note?: string) {
    const activity = await resolveOwned(reviewerId, id, role);
    if (activity.status !== "pending_review") {
      throw new AppError("Activity has already been reviewed", 400);
    }

    await activitiesRepository.updateOwned(activity.id, {
      status: "published",
      approver: { connect: { id: reviewerId } },
      review_note: note ?? null,
      updated_at: new Date(),
    });

    return mapActivity(await load(activity.id));
  },

  /** PENDING -> REJECTED. Admin only. */
  async reject(id: number, reviewerId: number, role: string, note?: string) {
    const activity = await resolveOwned(reviewerId, id, role);
    if (activity.status !== "pending_review") {
      throw new AppError("Activity has already been reviewed", 400);
    }

    await activitiesRepository.updateOwned(activity.id, {
      status: "rejected",
      approver: { connect: { id: reviewerId } },
      review_note: note ?? null,
      updated_at: new Date(),
    });

    return mapActivity(await load(activity.id));
  },
};
