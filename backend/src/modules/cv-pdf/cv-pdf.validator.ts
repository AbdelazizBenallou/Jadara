import { z } from "zod";

export const listPdfRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type ListPdfRequestsInput = z.infer<typeof listPdfRequestsSchema>;
