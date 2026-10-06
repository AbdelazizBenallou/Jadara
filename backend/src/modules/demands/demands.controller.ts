import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { demandService } from "./demands.service.js";
import type { ReviewDemandInput, SubmitDemandInput } from "./demands.validator.js";

// Returns the numeric route param, or null after answering with a 400.
function readId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    response.error(res, "Invalid demand ID", 400);
    return null;
  }
  return id;
}

export const demandController = {
  submit: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const data = req.body as SubmitDemandInput;
    const result = await demandService.submit(data, files);

    response.success(res, result, "Registration demand submitted for review", 201);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await demandService.getAll(
      req.query as Record<string, string | undefined>,
    );
    response.paginated(res, result.demands, result.meta, "Demands fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const demand = await demandService.getById(id);
    response.success(res, demand, "Demand fetched successfully");
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const demand = await demandService.getMine(req.user!.userId);
    response.success(res, demand, "Demand fetched successfully");
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = req.body as ReviewDemandInput;
    const adminId = req.user!.userId;
    const demand = await demandService.approve(id, adminId, data.note);
    response.success(res, demand, "Demand approved");
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = req.body as ReviewDemandInput;
    const adminId = req.user!.userId;
    const demand = await demandService.reject(id, adminId, data.note);
    response.success(res, demand, "Demand rejected");
  }),

  resendNotification: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const adminId = req.user!.userId;
    const demand = await demandService.resendNotification(id, adminId);
    response.success(res, demand, "Decision notification sent");
  }),
};