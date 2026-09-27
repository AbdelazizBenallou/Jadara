import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { skillService } from "./skills.service.js";
import type { CreateSkillInput, UpdateSkillInput } from "./skills.validator.js";

export const skillController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await skillService.getAll(req.query as { page?: string; limit?: string });
    response.paginated(res, result.skills, result.meta, "Skills fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid skill ID", 400);
      return;
    }
    const data = await skillService.getById(id);
    response.success(res, data, "Skill fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await skillService.create(req.body as CreateSkillInput);
    response.success(res, data, "Skill created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid skill ID", 400);
      return;
    }
    const data = await skillService.update(id, req.body as UpdateSkillInput);
    response.success(res, data, "Skill updated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid skill ID", 400);
      return;
    }
    await skillService.remove(id);
    response.success(res, null, "Skill deleted successfully");
  }),
};
