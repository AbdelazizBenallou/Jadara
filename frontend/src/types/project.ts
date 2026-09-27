export interface Evidence {
  id: number;
  project_id: number;
  type: "file" | "link";
  title: string;
  description?: string | null;
  file_url?: string | null;
  external_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  status: "draft" | "under_review" | "verified";
  github_url?: string | null;
  live_url?: string | null;
  figma_url?: string | null;
  domain_id?: number | null;
  domains?: { id: number; name: string } | null;
  evidence?: Evidence[];
  rating?: { average: number; count: number } | null;
  created_at: string;
  updated_at: string;
}
