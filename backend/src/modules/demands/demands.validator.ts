import { z } from "zod";

export const listDemandsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const reviewDemandSchema = z.object({
  note: z.string().max(1000).optional(),
});

export type ListDemandsInput = z.infer<typeof listDemandsSchema>;
export type ReviewDemandInput = z.infer<typeof reviewDemandSchema>;
