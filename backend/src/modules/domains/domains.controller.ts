import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { domainService } from "./domains.service.js";
import type {
  AssignSkillInput,
  CreateDomainInput,
  UpdateDomainInput,
} from "./domains.validator.js";

export const domainController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await domainService.getAll(req.query as { page?: string; limit?: string });
    response.paginated(res, result.domains, result.meta, "Domains fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    const data = await domainService.getById(id);
    response.success(res, data, "Domain fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await domainService.create(req.body as CreateDomainInput);
    response.success(res, data, "Domain created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    const data = await domainService.update(id, req.body as UpdateDomainInput);
    response.success(res, data, "Domain updated successfully");
  }),

  getSkillsByDomainId: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    const data = await domainService.getSkillsByDomainId(id);
    response.success(res, data, "Skills fetched successfully");
  }),

  getReviewersByDomainId: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    const data = await domainService.getReviewersByDomainId(id);
    response.success(res, data, "Reviewers fetched successfully");
  }),

  getAllReviewers: asyncHandler(async (req: Request, res: Response) => {
    const data = await domainService.getAllReviewers();
    response.success(res, data, "Reviewers fetched successfully");
  }),

  addSkillsToDomain: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    const data = await domainService.addSkillsToDomain(id, req.body as AssignSkillInput);
    response.success(
      res,
      data,
      data.added.length === 1 ? "Skill assigned successfully" : "Skills assigned successfully",
    );
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid domain ID", 400);
      return;
    }
    await domainService.remove(id);
    response.success(res, null, "Domain deleted successfully");
  }),
};
