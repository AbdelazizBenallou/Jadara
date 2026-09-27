import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  github_url: z.string().url().max(500).optional(),
  live_url: z.string().url().max(500).optional(),
  figma_url: z.string().url().max(500).optional(),
  domain_id: z.number().int().positive().nullable().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  github_url: z.string().url().max(500).nullable().optional(),
  live_url: z.string().url().max(500).nullable().optional(),
  figma_url: z.string().url().max(500).nullable().optional(),
  domain_id: z.number().int().positive().nullable().optional(),
});

export const listProjectsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const linkEvidenceSchema = z.object({
  document_id: z.number().int().positive(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type LinkEvidenceInput = z.infer<typeof linkEvidenceSchema>;
