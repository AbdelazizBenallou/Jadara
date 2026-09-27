import { z } from "zod";
import { LanguageProficiency } from "@prisma/client";

// ─── Work Experience ─────────────────────────────────────────
export const createWorkExperienceSchema = z.object({
  company: z.string().min(1).max(255),
  job_title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
});

export const updateWorkExperienceSchema = z.object({
  company: z.string().min(1).max(255).optional(),
  job_title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
});

// ─── Education ───────────────────────────────────────────────
export const createEducationSchema = z.object({
  school: z.string().min(1).max(255),
  degree: z.string().min(1).max(255),
  field_of_study: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
});

export const updateEducationSchema = z.object({
  school: z.string().min(1).max(255).optional(),
  degree: z.string().min(1).max(255).optional(),
  field_of_study: z.string().max(255).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  is_current: z.boolean().optional(),
});

// ─── Certifications ──────────────────────────────────────────
export const createCertificationSchema = z.object({
  name: z.string().min(1).max(255),
  issuer: z.string().max(255).optional(),
  issue_date: z.coerce.date().optional(),
  expiry_date: z.coerce.date().nullable().optional(),
  credential_url: z.string().url().max(500).optional(),
});

export const updateCertificationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  issuer: z.string().max(255).nullable().optional(),
  issue_date: z.coerce.date().nullable().optional(),
  expiry_date: z.coerce.date().nullable().optional(),
  credential_url: z.string().url().max(500).nullable().optional(),
});

// ─── Languages ───────────────────────────────────────────────
export const createLanguageSchema = z.object({
  language_id: z.number().int().positive(),
  proficiency: z.nativeEnum(LanguageProficiency),
});

export const updateLanguageSchema = z.object({
  proficiency: z.nativeEnum(LanguageProficiency),
});

// ─── Types ───────────────────────────────────────────────────
export type CreateWorkExperienceInput = z.infer<typeof createWorkExperienceSchema>;
export type UpdateWorkExperienceInput = z.infer<typeof updateWorkExperienceSchema>;
export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
