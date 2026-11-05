import type { Skill } from "./skill";

export interface Domain {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubDomain {
  id: number;
  name: string;
  description?: string | null;
  domain_id?: number | null;
  domain?: { id: number; name: string } | null;
}

export interface DomainReviewer {
  id: number;
  email: string;
  status?: string;
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface DomainDetail extends Domain {
  skills?: Skill[];
  reviewers?: DomainReviewer[];
  sub_domains?: SubDomain[];
}

export interface DomainInput {
  name: string;
  description?: string;
}

export interface SubDomainInput {
  name: string;
  description?: string;
  domain_id?: number;
}
