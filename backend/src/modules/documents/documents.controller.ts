import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { documentService } from "./documents.service.js";
import type { UploadDocumentInput } from "./documents.validator.js";

export const documentController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await documentService.getAll(
      userId,
      req.query as { page?: string; limit?: string; type?: string },
    );
    response.paginated(res, result.documents, result.meta, "Documents fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid document ID", 400);
      return;
    }
    const doc = await documentService.getById(userId, id);
    response.success(res, doc, "Document fetched successfully");
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const file = req.file;
    if (!file) {
      response.error(res, "File is required", 400);
      return;
    }
    const doc = await documentService.upload(userId, req.body as UploadDocumentInput, file);
    response.success(res, doc, "Document uploaded successfully", 201);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid document ID", 400);
      return;
    }
    await documentService.delete(userId, id);
    response.success(res, null, "Document deleted successfully");
  }),
};
