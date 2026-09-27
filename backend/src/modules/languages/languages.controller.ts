import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { languageService } from "./languages.service.js";
import type { CreateLanguageInput, UpdateLanguageInput } from "./languages.validator.js";

export const languageController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await languageService.getAll(req.query as { page?: string; limit?: string });
    response.paginated(res, result.languages, result.meta, "Languages fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid language ID", 400);
      return;
    }
    const data = await languageService.getById(id);
    response.success(res, data, "Language fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await languageService.create(req.body as CreateLanguageInput);
    response.success(res, data, "Language created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid language ID", 400);
      return;
    }
    const data = await languageService.update(id, req.body as UpdateLanguageInput);
    response.success(res, data, "Language updated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid language ID", 400);
      return;
    }
    await languageService.remove(id);
    response.success(res, null, "Language deleted successfully");
  }),
};
