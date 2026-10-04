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

    const reviewerDomainId = await reviewRepository.findReviewerDomainId(reviewerId);
    if (!reviewerDomainId) {
      return {
        reviews: [],
        meta: { total: 0, page, limit, totalPages: 0, nextCursor: null },
      };
    }

    const { projects, total } = await reviewRepository.findAvailable(
      reviewerId,
      reviewerDomainId,
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
          sub_domain_id: p.sub_domain_id,
          sub_domain: p.sub_domain,
          sub_domains: p.sub_domain,
          domain: p.sub_domain?.domain ?? null,
          user: {
            id: p.users.id,
            email: p.users.email,
            profile: p.users.profiles,
          },
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
          sub_domain_id: r.projects.sub_domain_id,
          sub_domain: r.projects.sub_domain,
          sub_domains: r.projects.sub_domain,
          domain: r.projects.sub_domain?.domain ?? null,
          user: {
            id: r.projects.users.id,
            email: r.projects.users.email,
            profile: r.projects.users.profiles,
          },
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

    const ownProject = project.user_id === reviewerId;
    const ownReview = await reviewRepository.findReview(projectId, reviewerId);

    const reviewerDomainId = await reviewRepository.findReviewerDomainId(reviewerId);
    const projectDomainId = project.sub_domain?.domain_id;
    const inDomain =
      reviewerDomainId !== null &&
      projectDomainId !== undefined &&
      projectDomainId === reviewerDomainId;

    if (!ownProject && !ownReview && !inDomain) {
      throw new AppError("This project is not in your assigned domain", 403);
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
        domain: project.sub_domain?.domain ?? null,
        sub_domains: project.sub_domain ?? null,
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
    if (!project.sub_domain || !project.sub_domain.domain_id) {
      throw new AppError("This project is not in your assigned domain", 403);
    }

    const reviewerDomainId = await reviewRepository.findReviewerDomainId(reviewerId);
    if (!reviewerDomainId || project.sub_domain.domain_id !== reviewerDomainId) {
      throw new AppError("This project is not in your assigned domain", 403);
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

    if (!project.sub_domain || !project.sub_domain.domain_id) {
      throw new AppError("This project is not in your assigned domain", 403);
    }

    const reviewerDomainId = await reviewRepository.findReviewerDomainId(reviewerId);
    if (!reviewerDomainId || project.sub_domain.domain_id !== reviewerDomainId) {
      throw new AppError("This project is not in your assigned domain", 403);
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

  async getReviewerDomain(reviewerId: number) {
    return reviewRepository.findReviewerDomain(reviewerId);
  },

  async getReviewerDomains(reviewerId: number) {
    return reviewRepository.findReviewerDomain(reviewerId);
  },

  async setReviewerDomains(reviewerId: number, data: SetReviewerDomainsInput) {
    const domainId = data.domain_id;

    const existingDomain = await prisma.domains.findUnique({
      where: { id: domainId },
      select: { id: true, name: true },
    });
    if (!existingDomain) {
      throw new AppError(`Domain with ID ${domainId} not found`, 404);
    }

    await reviewRepository.setReviewerDomains(reviewerId, domainId);
    return this.getReviewerDomain(reviewerId);
  },

  async removeReviewerDomain(reviewerId: number, domainId?: number) {
    const count = await reviewRepository.removeReviewerDomain(reviewerId, domainId);
    if (count === 0) {
      throw new AppError("Reviewer domain assignment not found", 404);
    }
    return this.getReviewerDomain(reviewerId);
  },
};
