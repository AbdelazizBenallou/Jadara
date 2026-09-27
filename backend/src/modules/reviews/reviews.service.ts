import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import prisma from "../../../framework/config/prisma.js";
import { reviewRepository } from "./reviews.repository.js";
import type { RatingInput, SetReviewerDomainsInput } from "./reviews.validator.js";

export const reviewService = {
  async available(reviewerId: number, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const domainIds = await reviewRepository.findReviewerDomainIds(reviewerId);
    const { projects, total } = await reviewRepository.findAvailable(
      reviewerId,
      domainIds,
      page,
      limit,
    );
    const totalPages = Math.ceil(total / limit);

    const summary = await reviewRepository.ratingsSummary(projects.map((p) => p.id));

    return {
      reviews: projects.map((p) => ({
        id: p.id,
        project_id: p.id,
        status: p.status,
        submitted_at: p.created_at,
        rating: {
          average: summary.get(p.id)?.average ?? null,
          count: summary.get(p.id)?.count ?? 0,
        },
        project: {
          id: p.id,
          title: p.title,
          description: p.description,
          user: {
            id: p.users.id,
            email: p.users.email,
            profile: p.users.profiles,
          },
          domain: p.domains,
        },
      })),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  async mine(reviewerId: number, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { reviews, total } = await reviewRepository.findMine(reviewerId, page, limit);
    const totalPages = Math.ceil(total / limit);

    const summary = await reviewRepository.ratingsSummary(reviews.map((r) => r.project_id));

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        project_id: r.project_id,
        rating: r.rating,
        feedback: r.feedback,
        created_at: r.created_at,
        updated_at: r.updated_at,
        project_average: summary.get(r.project_id)?.average ?? null,
        project_rating_count: summary.get(r.project_id)?.count ?? 0,
        project: {
          id: r.projects.id,
          title: r.projects.title,
          description: r.projects.description,
          status: r.projects.status,
          user: {
            id: r.projects.users.id,
            email: r.projects.users.email,
            profile: r.projects.users.profiles,
          },
          domain: r.projects.domains,
        },
      })),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  async getById(reviewerId: number, projectId: number) {
    const project = await reviewRepository.findProjectDetail(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const domainIds = await reviewRepository.findReviewerDomainIds(reviewerId);
    const ownProject = project.user_id === reviewerId;
    const ownReview = await reviewRepository.findReview(projectId, reviewerId);
    const inDomain = project.domain_id !== null && domainIds.includes(project.domain_id);

    if (!ownProject && !ownReview && !inDomain) {
      throw new AppError("This project is not in your assigned domains", 403);
    }

    const reviews = await reviewRepository.findReviewsByProject(projectId);
    const evidenceWithUrls = await Promise.all(
      project.evidence.map(async (e) => ({
        ...e,
        download_url: e.file_url
          ? await storage.getPresignedUrl(BUCKETS.evidence, e.file_url)
          : null,
      })),
    );

    const summary = await reviewRepository.ratingsSummary([projectId]);

    return {
      id: projectId,
      project_id: projectId,
      status: project.status,
      rating: {
        average: summary.get(projectId)?.average ?? null,
        count: summary.get(projectId)?.count ?? 0,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        feedback: r.feedback,
        created_at: r.created_at,
        reviewer: {
          id: r.reviewer.id,
          email: r.reviewer.email,
          profile: r.reviewer.profiles,
        },
      })),
      project: {
        ...project,
        evidence: evidenceWithUrls,
      },
    };
  },

  async rate(reviewerId: number, projectId: number, data: RatingInput) {
    const project = await reviewRepository.findProjectDetail(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.status !== "under_review" && project.status !== "verified") {
      throw new AppError("Only projects under review can be rated", 400);
    }
    if (project.user_id === reviewerId) {
      throw new AppError("You cannot rate your own project", 400);
    }
    if (project.domain_id === null) {
      throw new AppError("Project has no domain assigned; cannot be rated", 400);
    }

    const domainIds = await reviewRepository.findReviewerDomainIds(reviewerId);
    if (!domainIds.includes(project.domain_id)) {
      throw new AppError("This project is not in your assigned domains", 403);
    }

    const existing = await reviewRepository.findReview(projectId, reviewerId);
    if (existing) {
      throw new AppError("You have already rated this project; use PUT /rate to update it", 400);
    }

    await reviewRepository.createReview(projectId, reviewerId, data.rating, data.feedback);

    if (project.status === "under_review") {
      await prisma.projects.update({
        where: { id: projectId },
        data: { status: "verified", updated_at: new Date() },
      });
    }

    const summary = await reviewRepository.ratingsSummary([projectId]);

    return {
      project_id: projectId,
      rating: data.rating,
      feedback: data.feedback || null,
      project_status: "verified",
      rating_average: summary.get(projectId)?.average ?? null,
      rating_count: summary.get(projectId)?.count ?? 0,
    };
  },

  async updateRating(reviewerId: number, projectId: number, data: RatingInput) {
    const review = await reviewRepository.findReview(projectId, reviewerId);
    if (!review) {
      throw new AppError("You have not rated this project yet", 404);
    }

    const project = await reviewRepository.findProjectDetail(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.domain_id === null) {
      throw new AppError("Project has no domain assigned; cannot be rated", 400);
    }

    const domainIds = await reviewRepository.findReviewerDomainIds(reviewerId);
    if (!domainIds.includes(project.domain_id)) {
      throw new AppError("This project is not in your assigned domains", 403);
    }

    await reviewRepository.updateReview(projectId, reviewerId, data.rating, data.feedback);

    const summary = await reviewRepository.ratingsSummary([projectId]);

    return {
      project_id: projectId,
      rating: data.rating,
      feedback: data.feedback || null,
      project_status: project.status,
      rating_average: summary.get(projectId)?.average ?? null,
      rating_count: summary.get(projectId)?.count ?? 0,
    };
  },

  async getReviewerDomains(reviewerId: number) {
    const rows = await reviewRepository.findReviewerDomains(reviewerId);
    return rows.map((r) => r.domains);
  },

  async setReviewerDomains(reviewerId: number, data: SetReviewerDomainsInput) {
    const { domain_ids: domainIds } = data;

    const existingDomains = await prisma.domains.findMany({
      where: { id: { in: domainIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingDomains.map((d) => d.id));
    const missing = domainIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new AppError(`Domains not found: ${missing.join(", ")}`, 400);
    }

    await reviewRepository.setReviewerDomains(reviewerId, domainIds);
    return this.getReviewerDomains(reviewerId);
  },

  async removeReviewerDomain(reviewerId: number, domainId: number) {
    const count = await reviewRepository.removeReviewerDomain(reviewerId, domainId);
    if (count === 0) {
      throw new AppError("Reviewer domain assignment not found", 404);
    }
    return this.getReviewerDomains(reviewerId);
  },
};
