import { z } from "zod";

export const createLanguageSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(10).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateLanguageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(10).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const listLanguagesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
