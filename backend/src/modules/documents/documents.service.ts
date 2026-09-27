import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { documentRepository } from "./documents.repository.js";
import type { UploadDocumentInput } from "./documents.validator.js";

export const documentService = {
  async getAll(userId: number, query: { page?: string; limit?: string; type?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { documents, total } = await documentRepository.findAll(userId, page, limit, query.type);
    const totalPages = Math.ceil(total / limit);

    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        download_url: await storage.getPresignedUrl(BUCKETS.documents, doc.file_url),
      })),
    );

    return {
      documents: docsWithUrls,
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  async getById(userId: number, documentId: number) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new AppError("Document not found", 404);
    }
    if (doc.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    const download_url = await storage.getPresignedUrl(BUCKETS.documents, doc.file_url);
    return { ...doc, download_url };
  },

  async upload(userId: number, data: UploadDocumentInput, file: Express.Multer.File) {
    if (!file) {
      throw new AppError("File is required", 400);
    }

    const result = await storage.upload(BUCKETS.documents, "documents", file, userId);

    const doc = await documentRepository.create(userId, {
      name: data.name,
      type: data.type,
      file_url: result.objectName,
      file_size: result.fileSize,
      mime_type: result.mimeType,
    });

    return doc;
  },

  async delete(userId: number, documentId: number) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new AppError("Document not found", 404);
    }
    if (doc.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    await storage.delete(BUCKETS.documents, doc.file_url);
    await documentRepository.delete(documentId);
  },
};
