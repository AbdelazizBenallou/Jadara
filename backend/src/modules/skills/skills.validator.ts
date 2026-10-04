import { z } from "zod";

export const createSkillCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const listSkillCategoriesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  category_id: z.number().int().positive(),
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  category_id: z.number().int().positive().optional(),
});

export const listSkillsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateSkillCategoryInput = z.infer<typeof createSkillCategorySchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
