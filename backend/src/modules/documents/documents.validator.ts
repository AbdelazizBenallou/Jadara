import { z } from "zod";

export const uploadDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["certificate", "project", "workDoc"]),
});

export const listDocumentsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(["certificate", "project", "workDoc"]).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
