import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { dashboardService } from "./dashboard.service.js";

export const dashboardController = {
  getSummary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();
    response.success(res, summary, "Dashboard summary retrieved");
  }),
};
