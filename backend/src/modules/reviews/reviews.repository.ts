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
  sub_domain_id: true,
  sub_domain: {
    select: {
      id: true,
      name: true,
      domain_id: true,
      domain: {
        select: { id: true, name: true },
      },
    },
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
  async findAvailable(
    reviewerId: number,
    domainIdOrIds: number | number[],
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const domainIds = Array.isArray(domainIdOrIds) ? domainIdOrIds : [domainIdOrIds];
    const where = {
      status: { in: reviewableStatuses },
      sub_domain: {
        domain_id: { in: domainIds },
      },
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

  async findReviewerDomainId(userId: number): Promise<number | null> {
    const row = await prisma.reviewer_domains.findUnique({
      where: { user_id: userId },
      select: { domain_id: true },
    });
    return row?.domain_id ?? null;
  },

  async findReviewerDomain(userId: number) {
    const row = await prisma.reviewer_domains.findUnique({
      where: { user_id: userId },
      select: {
        domain_id: true,
        created_at: true,
        domains: { select: { id: true, name: true, description: true } },
      },
    });
    return row?.domains ?? null;
  },

  async findReviewerDomainIds(userId: number): Promise<number[]> {
    const domainId = await this.findReviewerDomainId(userId);
    return domainId !== null ? [domainId] : [];
  },

  async findReviewerDomains(userId: number) {
    const domain = await this.findReviewerDomain(userId);
    return domain ? [{ domains: domain }] : [];
  },

  async setReviewerDomains(userId: number, domainId: number) {
    return prisma.reviewer_domains.upsert({
      where: { user_id: userId },
      update: { domain_id: domainId },
      create: { user_id: userId, domain_id: domainId },
      include: {
        domains: { select: { id: true, name: true } },
      },
    });
  },

  async removeReviewerDomain(userId: number, domainId?: number) {
    const where: { user_id: number; domain_id?: number } = { user_id: userId };
    if (domainId !== undefined) {
      where.domain_id = domainId;
    }
    const result = await prisma.reviewer_domains.deleteMany({ where });
    return result.count;
  },
};
