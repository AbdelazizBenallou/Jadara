import { z } from "zod";

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(10),
  feedback: z.string().max(2000).optional(),
});

export const listReviewsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const setReviewerDomainsSchema = z.object({
  domain_id: z.number().int().positive(),
});

export type RatingInput = z.infer<typeof ratingSchema>;
export type SetReviewerDomainsInput = z.infer<typeof setReviewerDomainsSchema>;

