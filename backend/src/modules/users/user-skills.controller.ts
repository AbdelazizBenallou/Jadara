import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { userSkillsService } from "./user-skills.service.js";
import type { AddUserSkillsInput, UpdateSkillLevelInput } from "./user-skills.validator.js";

const parseUserId = (req: Request, res: Response): number | null => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    response.error(res, "Invalid user ID", 400);
    return null;
  }
  return id;
};

const parseSkillId = (req: Request, res: Response): number | null => {
  const id = Number(req.params.skillId);
  if (isNaN(id)) {
    response.error(res, "Invalid skill ID", 400);
    return null;
  }
  return id;
};

export const userSkillsController = {
  getSkills: asyncHandler(async (req: Request, res: Response) => {
    const data = await userSkillsService.getSkills(req.user!.userId);
    response.success(res, data, "Your skills fetched successfully");
  }),

  addSkills: asyncHandler(async (req: Request, res: Response) => {
    const result = await userSkillsService.addSkills(
      req.user!.userId,
      req.body as AddUserSkillsInput,
    );
    response.success(
      res,
      result,
      result.skills.length === 1 ? "Skill assigned successfully" : "Skills assigned successfully",
    );
  }),

  updateSkill: asyncHandler(async (req: Request, res: Response) => {
    const skillId = parseSkillId(req, res);
    if (skillId === null) return;
    await userSkillsService.updateSkillLevel(
      req.user!.userId,
      skillId,
      req.body as UpdateSkillLevelInput,
    );
    response.success(res, null, "Skill level updated successfully");
  }),

  removeSkill: asyncHandler(async (req: Request, res: Response) => {
    const skillId = parseSkillId(req, res);
    if (skillId === null) return;
    await userSkillsService.removeSkill(req.user!.userId, skillId);
    response.success(res, null, "Skill removed successfully");
  }),

  getUserSkills: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req, res);
    if (userId === null) return;
    const data = await userSkillsService.getSkills(userId);
    response.success(res, data, "User skills fetched successfully");
  }),

  addUserSkills: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req, res);
    if (userId === null) return;
    const result = await userSkillsService.addSkills(userId, req.body as AddUserSkillsInput);
    response.success(
      res,
      result,
      result.skills.length === 1 ? "Skill assigned successfully" : "Skills assigned successfully",
    );
  }),

  updateUserSkill: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req, res);
    if (userId === null) return;
    const skillId = parseSkillId(req, res);
    if (skillId === null) return;
    await userSkillsService.updateSkillLevel(userId, skillId, req.body as UpdateSkillLevelInput);
    response.success(res, null, "Skill level updated successfully");
  }),

  removeUserSkill: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req, res);
    if (userId === null) return;
    const skillId = parseSkillId(req, res);
    if (skillId === null) return;
    await userSkillsService.removeSkill(userId, skillId);
    response.success(res, null, "Skill removed successfully");
  }),
};
