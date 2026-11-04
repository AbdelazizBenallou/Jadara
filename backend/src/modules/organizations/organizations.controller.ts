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

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const organization = await organizationService.getById(id);
    response.success(res, organization, "Organization profile fetched successfully");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const q = req.query.q as string | undefined;

    const result = await organizationService.list({ page, limit, q });
    response.success(res, result.items, "Organizations fetched successfully", 200, result.meta);
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
