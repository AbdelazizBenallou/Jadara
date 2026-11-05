import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { companyService } from "./companies.service.js";
import type { UpdateCompanyInput } from "./companies.validator.js";

export const companyController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.getMine(req.user!.userId);
    response.success(res, company, "Company profile fetched successfully");
  }),

  updateMine: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.updateMine(
      req.user!.userId,
      req.body as UpdateCompanyInput,
    );
    response.success(res, company, "Company profile updated successfully");
  }),
};
