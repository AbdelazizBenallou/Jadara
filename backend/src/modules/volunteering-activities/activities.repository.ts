import prisma from "../../../framework/config/prisma.js";
import type { Prisma, ActivityStatus } from "@prisma/client";

const activityInclude = {
  organization: true,
  category: true,
  approver: { select: { id: true, email: true } },
  required_skills: {
    include: { skill: { select: { id: true, name: true, description: true } } },
    orderBy: { id: "asc" as const },
  },
  documents: true,
} satisfies Prisma.volunteering_activitiesInclude;

type ActivityWithRelations = Prisma.volunteering_activitiesGetPayload<{
  include: typeof activityInclude;
}>;

export type { ActivityWithRelations };

export type ActivityListParams = {
  page: number;
  limit: number;
  status?: ActivityStatus;
  q?: string;
  category_id?: number;
};

/** Params for the public published feed (only visible activities). */
export type PublishedActivityListParams = {
  page: number;
  limit: number;
  now: Date;
  q?: string;
  search?: string;
  category_id?: number;
  location?: string;
  organization_id?: number;
  required_skill_id?: number;
  start_date?: Date;
  end_date?: Date;
};

const buildWhere = (params: ActivityListParams, organizationId?: number): Prisma.volunteering_activitiesWhereInput => {
  const where: Prisma.volunteering_activitiesWhereInput = {};
  if (organizationId !== undefined) where.organization_id = organizationId;
  if (params.status) where.status = params.status;
  if (params.q) where.title = { contains: params.q, mode: "insensitive" };
  if (params.category_id) where.category_id = params.category_id;
  return where;
};

export const activitiesRepository = {
  /** The caller's own organization. Never taken from the request body. */
  findOrganizationByUser(userId: number) {
    return prisma.organizations.findFirst({ where: { user_id: userId } });
  },

  findById(id: number): Promise<ActivityWithRelations | null> {
    return prisma.volunteering_activities.findUnique({
      where: { id },
      include: activityInclude,
    });
  },

  async listOwned(params: ActivityListParams, organizationId: number) {
    const where = buildWhere(params, organizationId);
    const [items, total] = await Promise.all([
      prisma.volunteering_activities.findMany({
        where,
        include: activityInclude,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.volunteering_activities.count({ where }),
    ]);
    return { items, total };
  },

  /** Admin moderation queue: every activity across every organization. */
  async listAll(params: ActivityListParams) {
    const where = buildWhere(params);
    const [items, total] = await Promise.all([
      prisma.volunteering_activities.findMany({
        where,
        include: activityInclude,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.volunteering_activities.count({ where }),
    ]);
    return { items, total };
  },

  /**
   * Public published feed. Only published activities that are still active
   * (org hasn't blocked them), not finished by date, and not past their
   * registration deadline.
   */
  async listPublished(params: PublishedActivityListParams) {
    const where: Prisma.volunteering_activitiesWhereInput = {
      status: "published",
      is_active: true,
      end_date: { gte: params.now },
      OR: [
        { registration_deadline: null },
        { registration_deadline: { gte: params.now } },
      ],
    };
    const term = params.q ?? params.search;
    if (term) where.title = { contains: term, mode: "insensitive" };
    if (params.category_id) where.category_id = params.category_id;
    if (params.location) where.location = { contains: params.location, mode: "insensitive" };
    if (params.organization_id) where.organization_id = params.organization_id;
    if (params.required_skill_id) {
      where.required_skills = { some: { skill_id: params.required_skill_id } };
    }
    // end_date is already filtered to "not finished" (gte now). A requested
    // start narrows it further. A requested end filters by activity start.
    if (params.start_date) {
      where.end_date = {
        gte: params.start_date > params.now ? params.start_date : params.now,
      };
    }
    if (params.end_date) {
      where.start_date = { lte: params.end_date };
    }

    const [items, total] = await Promise.all([
      prisma.volunteering_activities.findMany({
        where,
        include: activityInclude,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.volunteering_activities.count({ where }),
    ]);
    return { items, total };
  },

  /**
   * Creates the activity, its required skills and its authorization document
   * in one transaction so an activity can never exist without the document.
   */
  createWithDocument(
    data: {
      organization_id: number;
      category_id: number | null;
      title: string;
      description: string | null;
      location: string | null;
      start_date: Date;
      end_date: Date;
      required_volunteers: number;
      requirements: string | null;
      registration_deadline: Date | null;
    },
    skillIds: number[],
    document: { name: string; file_url: string; file_size: number; mime_type: string; user_id: number },
  ) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.volunteering_activities.create({ data });

      if (skillIds.length > 0) {
        await tx.activity_required_skills.createMany({
          data: skillIds.map((skill_id) => ({ activity_id: activity.id, skill_id })),
          skipDuplicates: true,
        });
      }

      await tx.documents.create({
        data: {
          user_id: document.user_id,
          activity_id: activity.id,
          name: document.name,
          type: "activity_authorization",
          file_url: document.file_url,
          file_size: document.file_size,
          mime_type: document.mime_type,
          status: "uploaded",
        },
      });

      return activity;
    });
  },

  updateOwned(id: number, data: Prisma.volunteering_activitiesUpdateInput) {
    return prisma.volunteering_activities.update({ where: { id }, data });
  },

  deleteOwned(id: number) {
    return prisma.volunteering_activities.delete({ where: { id } });
  },

  findDocumentByActivity(activityId: number) {
    return prisma.documents.findFirst({
      where: { activity_id: activityId },
      orderBy: { created_at: "desc" },
    });
  },

  /** Returns the subset of `ids` that actually exist, for exact missing_skills. */
  async findExistingSkillIds(ids: number[]) {
    if (ids.length === 0) return [] as number[];
    const rows = await prisma.skills.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  },

  findCategoryById(categoryId: number) {
    return prisma.activity_categories.findUnique({ where: { id: categoryId } });
  },

  async countApplications(activityId: number) {
    return prisma.volunteer_applications.count({ where: { activity_id: activityId } });
  },

  async countAcceptedApplications(activityId: number) {
    return prisma.volunteer_applications.count({
      where: { activity_id: activityId, status: "accepted" },
    });
  },

  findApplicationByUser(activityId: number, userId: number) {
    return prisma.volunteer_applications.findUnique({
      where: { user_id_activity_id: { user_id: userId, activity_id: activityId } },
      select: { id: true, status: true },
    });
  },

  findActivitySkill(activityId: number, skillId: number) {
    return prisma.activity_required_skills.findUnique({
      where: { activity_id_skill_id: { activity_id: activityId, skill_id: skillId } },
    });
  },

  addActivitySkills(activityId: number, skillIds: number[]) {
    return prisma.activity_required_skills.createMany({
      data: skillIds.map((skill_id) => ({ activity_id: activityId, skill_id })),
      skipDuplicates: true,
    });
  },

  deleteActivitySkill(activityId: number, skillId: number) {
    return prisma.activity_required_skills.deleteMany({
      where: { activity_id: activityId, skill_id: skillId },
    });
  },
};
