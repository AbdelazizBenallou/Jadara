import prisma from "../../../framework/config/prisma.js";
import type { ProjectStatus } from "@prisma/client";

const reviewableStatuses: ProjectStatus[] = ["under_review", "verified"];

const projectListItemSelect = {
  id: true,
  user_id: true,
  title: true,
  description: true,
  status: true,
  github_url: true,
  live_url: true,
  figma_url: true,
  created_at: true,
  updated_at: true,
  domain_id: true,
  domains: {
    select: { id: true, name: true },
  },
  users: {
    select: {
      id: true,
      email: true,
      profiles: { select: { first_name: true, last_name: true, avatar: true } },
    },
  },
} as const;

const reviewSelect = {
  id: true,
  project_id: true,
  reviewer_id: true,
  rating: true,
  feedback: true,
  created_at: true,
  updated_at: true,
  reviewer: {
    select: {
      id: true,
      email: true,
      profiles: { select: { first_name: true, last_name: true, avatar: true } },
    },
  },
} as const;

const projectDetailSelect = {
  ...projectListItemSelect,
  evidence: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      file_url: true,
      external_url: true,
      created_at: true,
    },
  },
} as const;

export const reviewRepository = {
  async findAvailable(reviewerId: number, domainIds: number[], page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      status: { in: reviewableStatuses },
      domain_id: { in: domainIds },
      user_id: { not: reviewerId },
      project_reviews: { none: { reviewer_id: reviewerId } },
    };

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        select: projectListItemSelect,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.projects.count({ where }),
    ]);

    return { projects, total };
  },

  async findMine(reviewerId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { reviewer_id: reviewerId };

    const [reviews, total] = await Promise.all([
      prisma.project_reviews.findMany({
        where,
        select: {
          ...reviewSelect,
          projects: {
            select: projectListItemSelect,
          },
        },
        skip,
        take: limit,
        orderBy: { updated_at: "desc" },
      }),
      prisma.project_reviews.count({ where }),
    ]);

    return { reviews, total };
  },

  async findProjectDetail(projectId: number) {
    return prisma.projects.findUnique({
      where: { id: projectId },
      select: projectDetailSelect,
    });
  },

  async findReviewsByProject(projectId: number) {
    return prisma.project_reviews.findMany({
      where: { project_id: projectId },
      select: reviewSelect,
      orderBy: { created_at: "asc" },
    });
  },

  async findReview(projectId: number, reviewerId: number) {
    return prisma.project_reviews.findUnique({
      where: { project_id_reviewer_id: { project_id: projectId, reviewer_id: reviewerId } },
      select: { id: true, rating: true, feedback: true, created_at: true, updated_at: true },
    });
  },

  async createReview(projectId: number, reviewerId: number, rating: number, feedback?: string) {
    return prisma.project_reviews.create({
      data: { project_id: projectId, reviewer_id: reviewerId, rating, feedback },
      select: reviewSelect,
    });
  },

  async updateReview(projectId: number, reviewerId: number, rating: number, feedback?: string) {
    return prisma.project_reviews.update({
      where: { project_id_reviewer_id: { project_id: projectId, reviewer_id: reviewerId } },
      data: { rating, feedback, updated_at: new Date() },
      select: reviewSelect,
    });
  },

  async ratingsSummary(projectIds: number[]) {
    if (projectIds.length === 0) {
      return new Map<number, { average: number | null; count: number }>();
    }
    const grouped = await prisma.project_reviews.groupBy({
      by: ["project_id"],
      where: { project_id: { in: projectIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return new Map(
      grouped.map((g) => [g.project_id, { average: g._avg.rating, count: g._count._all }]),
    );
  },

  async findReviewerDomainIds(userId: number) {
    const rows = await prisma.reviewer_domains.findMany({
      where: { user_id: userId },
      select: { domain_id: true },
    });
    return rows.map((r) => r.domain_id);
  },

  async findReviewerDomains(userId: number) {
    return prisma.reviewer_domains.findMany({
      where: { user_id: userId },
      select: {
        domains: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "asc" },
    });
  },

  async setReviewerDomains(userId: number, domainIds: number[]) {
    await prisma.$transaction([
      prisma.reviewer_domains.deleteMany({ where: { user_id: userId } }),
      prisma.reviewer_domains.createMany({
        data: domainIds.map((domainId) => ({ user_id: userId, domain_id: domainId })),
      }),
    ]);
  },

  async removeReviewerDomain(userId: number, domainId: number) {
    const result = await prisma.reviewer_domains.deleteMany({
      where: { user_id: userId, domain_id: domainId },
    });
    return result.count;
  },
};
