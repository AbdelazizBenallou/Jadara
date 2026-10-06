import { AppError } from "../../../framework/utils/AppError.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { storage } from "../../../framework/utils/storage.js";
import { activitiesRepository, type ActivityWithRelations } from "./activities.repository.js";
import type {
  CreateActivityInput,
  ListActivitiesInput,
  UpdateActivityInput,
} from "./activities.validation.js";

const ADMIN_ROLE = "Admin";

export type ActivityView = ReturnType<typeof mapActivity>;

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

  async getById(id: number, userId: number, role: string) {
    const activity = await resolveOwned(userId, id, role);
    return mapActivity(activity);
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
