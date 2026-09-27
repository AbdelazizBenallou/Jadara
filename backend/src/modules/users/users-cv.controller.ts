import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { cvService } from "./users-cv.service.js";

const parseId = (req: Request, res: Response, field: string): number | null => {
  const id = Number(req.params[field]);
  if (isNaN(id)) {
    response.error(res, `Invalid ${field}`, 400);
    return null;
  }
  return id;
};

export const cvController = {
  // ─── Work Experience ────────────────────────────────────────
  getWorkExperience: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.getWorkExperience(req.user!.userId);
    response.success(res, data, "Work experience retrieved");
  }),

  createWorkExperience: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.createWorkExperience(req.user!.userId, req.body);
    response.success(res, data, "Work experience created", 201);
  }),

  updateWorkExperience: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    const data = await cvService.updateWorkExperience(req.user!.userId, id, req.body);
    response.success(res, data, "Work experience updated");
  }),

  deleteWorkExperience: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    await cvService.deleteWorkExperience(req.user!.userId, id);
    response.success(res, null, "Work experience deleted");
  }),

  // ─── Education ──────────────────────────────────────────────
  getEducation: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.getEducation(req.user!.userId);
    response.success(res, data, "Education retrieved");
  }),

  createEducation: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.createEducation(req.user!.userId, req.body);
    response.success(res, data, "Education created", 201);
  }),

  updateEducation: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    const data = await cvService.updateEducation(req.user!.userId, id, req.body);
    response.success(res, data, "Education updated");
  }),

  deleteEducation: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    await cvService.deleteEducation(req.user!.userId, id);
    response.success(res, null, "Education deleted");
  }),

  // ─── Certifications ─────────────────────────────────────────
  getCertifications: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.getCertifications(req.user!.userId);
    response.success(res, data, "Certifications retrieved");
  }),

  createCertification: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.createCertification(req.user!.userId, req.body, req.file);
    response.success(res, data, "Certification created", 201);
  }),

  updateCertification: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    const data = await cvService.updateCertification(req.user!.userId, id, req.body, req.file);
    response.success(res, data, "Certification updated");
  }),

  deleteCertification: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    await cvService.deleteCertification(req.user!.userId, id);
    response.success(res, null, "Certification deleted");
  }),

  // ─── Languages ──────────────────────────────────────────────
  getLanguages: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.getLanguages(req.user!.userId);
    response.success(res, data, "Languages retrieved");
  }),

  createLanguage: asyncHandler(async (req: Request, res: Response) => {
    const data = await cvService.createLanguage(req.user!.userId, req.body);
    response.success(res, data, "Language added", 201);
  }),

  updateLanguage: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    const data = await cvService.updateLanguage(req.user!.userId, id, req.body);
    response.success(res, data, "Language updated");
  }),

  deleteLanguage: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req, res, "id");
    if (id === null) return;
    await cvService.deleteLanguage(req.user!.userId, id);
    response.success(res, null, "Language deleted");
  }),
};
