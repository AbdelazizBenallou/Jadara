import type { CVLanguage } from "@prisma/client";

/** Lifecycle states of a CV generation request (free-form String column in DB). */
export const CV_REQUEST_STATUS = {
  INCOMPLETE: "incomplete",
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  SUPERSEDED: "superseded",
} as const;

export type CvRequestStatus = (typeof CV_REQUEST_STATUS)[keyof typeof CV_REQUEST_STATUS];

/** All languages the enum supports (AR = Arabic — engine/template pending). */
export const CV_LANGUAGES = ["AR", "EN", "FR"] as const;

/** Languages that can actually be rendered today. AR is deferred until the RTL engine lands. */
export const CV_ACTIVE_LANGUAGES = ["EN", "FR"] as const;
export type CvActiveLanguage = (typeof CV_ACTIVE_LANGUAGES)[number];

export const DEFAULT_CV_LANGUAGE: CvActiveLanguage = "EN";

// Bump whenever ats-cv.tex changes so cached PDFs are regenerated.
export const TEMPLATE_VERSION = "10";

// CV sections that are hashed independently to detect changes.
export const CV_SECTIONS = [
  "profile",
  "work_experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "projects",
  "volunteering",
] as const;

export type CvSection = (typeof CV_SECTIONS)[number];

// entity_type values written to audit_logs for CV-affecting mutations.
export const CV_AUDIT_ENTITY = {
  profile: "cv_profile",
  work_experience: "cv_work_experience",
  education: "cv_education",
  skills: "cv_skills",
  languages: "cv_languages",
  certifications: "cv_certifications",
  projects: "cv_projects",
  volunteering: "cv_volunteering",
} as const satisfies Record<CvSection, string>;

export const CV_AUDIT_ENTITIES: readonly string[] = Object.values(CV_AUDIT_ENTITY);
