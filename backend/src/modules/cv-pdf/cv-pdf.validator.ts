import { z } from "zod";

export const listPdfRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const generateCvSchema = z
  .object({
    languages: z.array(z.enum(["AR", "EN", "FR"])).min(1).optional(),
    language: z.enum(["AR", "EN", "FR"]).optional(),
  })
  .default({});

export type ListPdfRequestsInput = z.infer<typeof listPdfRequestsSchema>;
export type GenerateCvInput = z.infer<typeof generateCvSchema>;
