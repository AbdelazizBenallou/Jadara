import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { reviewService } from "./reviews.service.js";
import type { RatingInput } from "./reviews.validator.js";

export const reviewController = {
  getAvailable: asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.available(
      req.user!.userId,
      req.query as { page?: string; limit?: string },
    );
    response.paginated(res, result.reviews, result.meta, "Available projects fetched successfully");
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const result = await reviewService.mine(
      reviewerId,
      req.query as { page?: string; limit?: string },
    );
    response.paginated(res, result.reviews, result.meta, "Review history fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const review = await reviewService.getById(reviewerId, id);
    response.success(res, review, "Project review fetched successfully");
  }),

  rate: asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const result = await reviewService.rate(reviewerId, projectId, req.body as RatingInput);
    response.success(res, result, "Rating submitted successfully");
  }),

  updateRating: asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = req.user!.userId;
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const result = await reviewService.updateRating(reviewerId, projectId, req.body as RatingInput);
    response.success(res, result, "Rating updated successfully");
  }),

  getMyDomains: asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.getReviewerDomains(req.user!.userId);
    response.success(res, result, "Reviewer domains fetched successfully");
  }),
};
