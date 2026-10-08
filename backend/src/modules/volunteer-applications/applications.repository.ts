import prisma from "../../../framework/config/prisma.js";
import type { Prisma } from "@prisma/client";

/**
 * Full application: activity (organization + required skills) and the
 * applicant's public profile, skills, education and work experience used by
 * the Organization when reviewing applications.
 */
const appInclude = {
  activity: {
    include: {
      organization: { select: { id: true, name: true } },
      required_skills: {
        include: { skill: { select: { id: true, name: true } } },
        orderBy: { id: "asc" as const },
      },
    },
  },
  user: {
    include: {
      profiles: true,
      user_skills: {
        include: { skills: { select: { id: true, name: true } } },
        orderBy: { id: "asc" as const },
      },
      educations: {
        orderBy: { start_date: "desc" as const },
        take: 3,
      },
      work_experiences: {
        orderBy: { start_date: "desc" as const },
        take: 3,
      },
    },
  },
} satisfies Prisma.volunteer_applicationsInclude;

type ApplicationRow = Prisma.volunteer_applicationsGetPayload<{
  include: typeof appInclude;
}>;

export type { ApplicationRow };

export type ApplicationStatusFilter = "pending" | "accepted" | "rejected" | "completed";

export const applicationsRepository = {
  findById(id: number): Promise<ApplicationRow | null> {
    return prisma.volunteer_applications.findUnique({
      where: { id },
      include: appInclude,
    });
  },

  findByIdForRouting(id: number) {
    return prisma.volunteer_applications.findUnique({
      where: { id },
      select: { id: true, activity_id: true },
    });
  },

  findExisting(activityId: number, userId: number) {
    return prisma.volunteer_applications.findUnique({
      where: { user_id_activity_id: { user_id: userId, activity_id: activityId } },
      select: { id: true },
    });
  },

  create(userId: number, activityId: number) {
    return prisma.volunteer_applications.create({
      data: { user_id: userId, activity_id: activityId, status: "pending" },
      select: {
        id: true,
        activity_id: true,
        status: true,
        application_date: true,
      },
    });
  },

  countAccepted(activityId: number) {
    return prisma.volunteer_applications.count({
      where: { activity_id: activityId, status: "accepted" },
    });
  },

  updateStatus(id: number, status: "accepted" | "rejected") {
    return prisma.volunteer_applications.update({
      where: { id },
      data: { status },
      include: appInclude,
    });
  },

  countMine(userId: number, status?: ApplicationStatusFilter) {
    return prisma.volunteer_applications.count({
      where: { user_id: userId, ...(status ? { status } : {}) },
    });
  },

  listMine(userId: number, status: ApplicationStatusFilter | undefined, page: number, limit: number) {
    return prisma.volunteer_applications.findMany({
      where: { user_id: userId, ...(status ? { status } : {}) },
      include: {
        activity: {
          include: {
            organization: { select: { id: true, name: true } },
            required_skills: {
              include: { skill: { select: { id: true, name: true } } },
              orderBy: { id: "asc" as const },
            },
          },
        },
      },
      orderBy: { application_date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  listByActivity(
    activityId: number,
    status: ApplicationStatusFilter | undefined,
  ) {
    return prisma.volunteer_applications.findMany({
      where: { activity_id: activityId, ...(status ? { status } : {}) },
      include: appInclude,
      orderBy: { application_date: "asc" },
    });
  },

  listAcceptedParticipants(activityId: number) {
    return prisma.volunteer_applications.findMany({
      where: { activity_id: activityId, status: "accepted" },
      include: {
        user: {
          include: {
            profiles: true,
            user_skills: {
              include: { skills: { select: { id: true, name: true } } },
              orderBy: { id: "asc" as const },
            },
          },
        },
      },
      orderBy: { application_date: "asc" },
    });
  },

  /**
   * ACCEPTED -> COMPLETED plus its user_completed_volunteering record, in a
   * single transaction. If either fails, both roll back. Never duplicates the
   * completion record (unique on user_id+activity_id; checked inside the tx).
   */
  completeAndCreateExperience(id: number) {
    return prisma.$transaction(async (tx) => {
      const app = await tx.volunteer_applications.findUnique({
        where: { id },
        select: {
          id: true,
          user_id: true,
          activity_id: true,
          status: true,
          activity: { select: { organization_id: true } },
        },
      });
      if (!app) return null;

      const existing = await tx.user_completed_volunteering.findUnique({
        where: {
          user_id_activity_id: { user_id: app.user_id, activity_id: app.activity_id },
        },
        select: { id: true },
      });

      if (!existing) {
        await tx.user_completed_volunteering.create({
          data: {
            user_id: app.user_id,
            activity_id: app.activity_id,
            organization_id: app.activity.organization_id,
          },
        });
      }

      return tx.volunteer_applications.update({
        where: { id },
        data: { status: "completed" },
        include: appInclude,
      });
    });
  },

  listCompleted(userId: number, page: number, limit: number) {
    return prisma.user_completed_volunteering.findMany({
      where: { user_id: userId },
      include: {
        activity: {
          select: { id: true, title: true, location: true, start_date: true, end_date: true },
        },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { completed_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  countCompleted(userId: number) {
    return prisma.user_completed_volunteering.count({
      where: { user_id: userId },
    });
  },
};