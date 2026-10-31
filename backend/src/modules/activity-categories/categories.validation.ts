import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one of name or description is required",
    path: ["name"],
  });

export const listCategoriesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().max(100).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
