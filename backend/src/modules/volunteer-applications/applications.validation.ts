import { z } from "zod";

// Applications are created with an empty body: user_id always comes from the
// verified access token, never from the request.

export const listMyApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["pending", "accepted", "rejected", "completed"]).optional(),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
  sort: z.literal("skill_match").optional(),
  min_skill_match: z.coerce.number().int().min(0).max(100).optional(),
});

export const completedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListMyApplicationsInput = z.infer<typeof listMyApplicationsQuerySchema>;
export type ListApplicationsInput = z.infer<typeof listApplicationsQuerySchema>;
export type CompletedQueryInput = z.infer<typeof completedQuerySchema>;