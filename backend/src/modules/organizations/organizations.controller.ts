import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { organizationService } from "./organizations.service.js";
import type { UpdateOrganizationInput } from "./organizations.validation.js";

export const organizationController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const organization = await organizationService.getMine(req.user!.userId);
    response.success(res, organization, "Organization fetched successfully");
  }),

  updateMine: asyncHandler(async (req: Request, res: Response) => {
    const organization = await organizationService.updateMine(
      req.user!.userId,
      req.body as UpdateOrganizationInput,
    );
    response.success(res, organization, "Organization updated successfully");
  }),

  removeMine: asyncHandler(async (req: Request, res: Response) => {
    const result = await organizationService.removeMine(req.user!.userId);
    response.success(res, result, "Organization deleted successfully");
  }),
};