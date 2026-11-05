import { z } from "zod";

export const updateCompanySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(255, "Name must not exceed 255 characters"),
  })
  .strict();

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
