export interface DemandRole {
  id: number;
  name: string;
}

export interface DemandApplicant {
  id: number;
  email: string;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

export interface DemandDomain {
  id: number;
  name: string;
}

export interface DemandDocument {
  id: number;
  name: string;
  mime_type?: string | null;
  file_size?: number | null;
  download_url?: string | null;
}

export interface Demand {
  id: number;
  status: string;
  created_at: string;
  updated_at?: string;
  note?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  role?: DemandRole | null;
  applicant?: DemandApplicant | null;
  domains?: DemandDomain[];
  documents?: DemandDocument[];
  details?: Record<string, unknown> | null;
}

export interface DemandDecisionInput {
  note?: string;
}
