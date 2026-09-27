import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { projectService } from "./projects.service.js";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.validator.js";

export const projectController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await projectService.getAll(
      userId,
      req.query as { page?: string; limit?: string },
    );
    response.paginated(res, result.projects, result.meta, "Projects fetched successfully");
  }),

  getAllAdmin: asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.getAllAdmin(req.query as { page?: string; limit?: string });
    response.paginated(res, result.projects, result.meta, "Projects fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const project = await projectService.getById(userId, id);
    response.success(res, project, "Project fetched successfully");
  }),

  getByIdAdmin: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const project = await projectService.getByIdAdmin(id);
    response.success(res, project, "Project fetched successfully");
  }),

  getByUserId: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }
    const result = await projectService.getAll(
      userId,
      req.query as { page?: string; limit?: string },
    );
    response.paginated(res, result.projects, result.meta, "User projects fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const project = await projectService.create(userId, req.body as CreateProjectInput);
    response.success(res, project, "Project created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const project = await projectService.update(userId, id, req.body as UpdateProjectInput);
    response.success(res, project, "Project updated successfully");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    await projectService.delete(userId, id);
    response.success(res, null, "Project deleted successfully");
  }),

  deleteAdmin: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    await projectService.deleteAdmin(id);
    response.success(res, null, "Project deleted successfully");
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const result = await projectService.submit(userId, id);
    response.success(res, result, "Project submitted for verification");
  }),

  uploadEvidence: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const file = req.file;
    if (!file) {
      response.error(res, "File is required", 400);
      return;
    }
    const evidence = await projectService.uploadEvidence(userId, id, file, {
      type: req.body.type || "evidence",
      title: req.body.title || file.originalname,
      description: req.body.description,
    });
    response.success(res, evidence, "Evidence uploaded successfully", 201);
  }),

  linkEvidence: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const { document_id } = req.body;
    if (!document_id) {
      response.error(res, "document_id is required", 400);
      return;
    }
    const evidence = await projectService.linkEvidence(userId, id, document_id);
    response.success(res, evidence, "Evidence linked successfully", 201);
  }),

  removeEvidence: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const evidenceId = Number(req.params.evidenceId);
    if (isNaN(evidenceId)) {
      response.error(res, "Invalid evidence ID", 400);
      return;
    }
    await projectService.removeEvidence(userId, id, evidenceId);
    response.success(res, null, "Evidence removed successfully");
  }),

  forceStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid project ID", 400);
      return;
    }
    const { status } = req.body;
    if (!status) {
      response.error(res, "status is required", 400);
      return;
    }
    const result = await projectService.forceStatus(id, status);
    response.success(res, result, "Project status updated");
  }),
};
