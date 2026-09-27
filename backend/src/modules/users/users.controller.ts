import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { usersService } from "./users.service.js";
import { reviewService } from "../reviews/reviews.service.js";
import type { SetReviewerDomainsInput } from "../reviews/reviews.validator.js";
import type { UpdateUserInput } from "./users.validator.js";

export const usersController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getAll(req.query as { page?: string; limit?: string });
    response.paginated(res, result.users, result.meta, "Users retrieved");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    const user = await usersService.getById(id);
    response.success(res, user, "User retrieved");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    const data = req.body as UpdateUserInput;
    const adminUserId = req.user!.userId;
    const user = await usersService.update(id, data, adminUserId);
    response.success(res, user, "User updated");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    const adminUserId = req.user!.userId;
    await usersService.remove(id, adminUserId);
    response.success(res, null, "User deleted");
  }),

  // ─── Public profile (any authenticated user) ─────────────
  getPublicProfile: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }
    const user = await usersService.getPublicProfile(id);
    response.success(res, user, "User profile retrieved");
  }),

  // ─── Profile (with avatar URL + socials) ─────────────────
  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await usersService.getMyProfile(userId);
    response.success(res, user, "Profile retrieved");
  }),

  updateMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await usersService.updateMyProfile(userId, req.body, req.file);
    response.success(res, user, "Profile updated");
  }),

  // ─── Activity (login history + devices) ──────────────────
  getMyActivity: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const activity = await usersService.getActivity(userId);
    response.success(res, activity, "Activity retrieved");
  }),

  // ─── Socials (add/remove only, list is in profile) ───────
  addMySocial: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { platform, url } = req.body;
    const social = await usersService.addSocial(userId, platform, url);
    response.success(res, social, "Social link added", 201);
  }),

  removeMySocial: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const socialId = Number(req.params.socialId);
    if (isNaN(socialId)) {
      response.error(res, "Invalid social ID", 400);
      return;
    }
    await usersService.removeSocial(userId, socialId);
    response.success(res, null, "Social link removed");
  }),

  // ─── Reviewer domain assignment (admin) ───────────────────
  getReviewerDomains: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid reviewer ID", 400);
      return;
    }
    const domains = await reviewService.getReviewerDomains(id);
    response.success(res, domains, "Reviewer domains retrieved");
  }),

  setReviewerDomains: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid reviewer ID", 400);
      return;
    }
    const domains = await reviewService.setReviewerDomains(id, req.body as SetReviewerDomainsInput);
    response.success(res, domains, "Reviewer domains updated");
  }),

  removeReviewerDomain: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const domainId = Number(req.params.domainId);
    if (isNaN(id) || isNaN(domainId)) {
      response.error(res, "Invalid reviewer or domain ID", 400);
      return;
    }
    const domains = await reviewService.removeReviewerDomain(id, domainId);
    response.success(res, domains, "Reviewer domain removed");
  }),
};
