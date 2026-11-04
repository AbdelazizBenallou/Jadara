export interface WorkExperience {
  id: number;
  company: string;
  job_title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
}

export interface WorkExperienceInput {
  company: string;
  job_title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  field_of_study?: string | null;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
}

export interface EducationInput {
  school: string;
  degree: string;
  field_of_study?: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
}

export interface Certification {
  id: number;
  name: string;
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file_url?: string | null;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export type LanguageProficiency =
  | "native"
  | "fluent"
  | "advanced"
  | "intermediate"
  | "beginner";

export interface UserLanguage {
  id: number;
  language_id?: number;
  proficiency: LanguageProficiency;
  languages?: Language | null;
}

export interface UserLanguageInput {
  language_id: number;
  proficiency: LanguageProficiency;
}

export type PdfStatusValue =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "superseded";

export interface PdfStatus {
  language?: string;
  status: PdfStatusValue;
  download_url?: string | null;
  error_message?: string | null;
}

export interface PdfStatusResponse {
  languages: PdfStatus[];
}

export interface PdfGenerationJob {
  language: string;
  status: PdfStatusValue;
  download_url: string | null;
}

export interface PdfGenerationResponse {
  jobs: PdfGenerationJob[];
}
