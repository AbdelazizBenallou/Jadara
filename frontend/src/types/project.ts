export interface Evidence {
  id: number;
  type: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  external_url?: string | null;
  download_url?: string | null;
  created_at: string;
}

export interface SubDomain {
  id: number;
  name: string;
  domain?: { id: number; name: string } | null;
}

export interface ProjectReview {
  id: number;
  rating: number;
  feedback?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reviewer?: {
    id: number;
    email: string;
    profiles?: { first_name?: string | null; last_name?: string | null; avatar?: string | null } | null;
  } | null;
}

export interface Project {
  id: number;
  user_id?: number;
  title: string;
  description: string | null;
  status: "draft" | "submitted" | "under_review" | "verified";
  github_url?: string | null;
  live_url?: string | null;
  figma_url?: string | null;
  sub_domain_id?: number | null;
  sub_domain?: SubDomain | null;
  sub_domains?: SubDomain | null;
  domain?: { id: number; name: string } | null;
  evidence?: Evidence[];
  evidence_count?: number;
  rating?: { average: number; count: number } | null;
  reviews?: ProjectReview[];
  created_at: string;
  updated_at: string;
}
