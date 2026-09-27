import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { demandService } from "./demands.service.js";
import type { ReviewDemandInput } from "./demands.validator.js";

export const demandController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await demandService.getAll(req.query as Record<string, string | undefined>);
    response.paginated(res, result.demands, result.meta, "Demands fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid demand ID", 400);
      return;
    }
    const demand = await demandService.getById(id);
    response.success(res, demand, "Demand fetched successfully");
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid demand ID", 400);
      return;
    }
    const data = req.body as ReviewDemandInput;
    const adminId = req.user!.userId;
    const demand = await demandService.approve(id, adminId, data.note);
    response.success(res, demand, "Demand approved");
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid demand ID", 400);
      return;
    }
    const data = req.body as ReviewDemandInput;
    const adminId = req.user!.userId;
    const demand = await demandService.reject(id, adminId, data.note);
    response.success(res, demand, "Demand rejected");
  }),
};
