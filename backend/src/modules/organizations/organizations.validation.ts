import { z } from "zod";

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    website: z.string().url().max(500).nullable().optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(50).nullable().optional(),
    location: z.string().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;