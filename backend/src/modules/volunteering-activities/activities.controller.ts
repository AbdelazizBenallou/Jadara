import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { activitiesService } from "./activities.service.js";
import type {
  CreateActivityInput,
  ListActivitiesInput,
  ReviewActivityInput,
  UpdateActivityInput,
} from "./activities.validation.js";

// Returns the numeric route param, or null after answering with a 400.
function readId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    response.error(res, "Invalid activity ID", 400);
    return null;
  }
  return id;
}

// Reads a skill id from the route, or null after answering with a 400.
function readSkillId(req: Request, res: Response): number | null {
  const id = Number(req.params.skillId);
  if (!req.params.skillId || Number.isNaN(id)) {
    response.error(res, "Invalid skill ID", 400);
    return null;
  }
  return id;
}

export const activitiesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateActivityInput;
    const activity = await activitiesService.create(
      req.user!.userId,
      data,
      req.file,
    );
    response.success(res, activity, "Activity submitted for review", 201);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await activitiesService.listAll(
      req.query as ListActivitiesInput & Record<string, string | undefined>,
    );
    response.paginated(res, result.activities, result.meta, "Activities fetched successfully");
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const result = await activitiesService.listMine(
      req.user!.userId,
      req.query as ListActivitiesInput & Record<string, string | undefined>,
    );
    response.paginated(res, result.activities, result.meta, "Activities fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const activity = await activitiesService.getById(id, req.user!.userId, req.user!.role);
    response.success(res, activity, "Activity fetched successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = req.body as UpdateActivityInput;
    const activity = await activitiesService.update(
      id,
      req.user!.userId,
      req.user!.role,
      data,
    );
    response.success(res, activity, "Activity updated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const result = await activitiesService.remove(id, req.user!.userId, req.user!.role);
    response.success(res, result, "Activity deleted successfully");
  }),

  addSkills: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const skillIds = (req.body as { required_skill_ids?: number[] }).required_skill_ids ?? [];
    const activity = await activitiesService.addSkills(
      id,
      req.user!.userId,
      req.user!.role,
      skillIds,
    );
    response.success(res, activity, "Required skills added");
  }),

  removeSkill: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;
    const skillId = readSkillId(req, res);
    if (skillId === null) return;

    const activity = await activitiesService.removeSkill(
      id,
      skillId,
      req.user!.userId,
      req.user!.role,
    );
    response.success(res, activity, "Required skill removed");
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = (req.body ?? {}) as ReviewActivityInput;
    const activity = await activitiesService.approve(
      id,
      req.user!.userId,
      req.user!.role,
      data.note,
    );
    response.success(res, activity, "Activity published");
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = (req.body ?? {}) as ReviewActivityInput;
    const activity = await activitiesService.reject(
      id,
      req.user!.userId,
      req.user!.role,
      data.note,
    );
    response.success(res, activity, "Activity rejected");
  }),
};
