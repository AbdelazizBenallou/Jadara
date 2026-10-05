import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export const updateUserSchema = z.object({
  status: z.enum(["active", "inactive", "locked", "pending"]).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  role_id: z.number().int().positive().optional(),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  gender: z.enum(["Male", "Female"]).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
});

export const addSocialSchema = z.object({
  platform_id: z.number().int().positive(),
  url: z.string().url().max(500),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddSocialInput = z.infer<typeof addSocialSchema>;
