import { deleteData, getData, getPaginated, patchData } from "./http";
import type { PaginatedResult } from "@/types/api";
import type { Activity } from "./activities";

export interface OrganizationSocial {
  id: number;
  platform?: string;
  url: string;
}

export interface Organization {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: string | null;
  description?: string | null;
  user_id?: number;
  logo_url?: string | null;
  cover_url?: string | null;
  total_published_activities?: number;
  created_at?: string;
  updated_at?: string;
  socials?: OrganizationSocial[];
  stats?: {
    total_activities: number;
    completed_volunteers: number;
  };
  activities?: Activity[];
  [key: string]: unknown;
}

export async function listOrganizations(filters: { page?: number; limit?: number; q?: string } = {}): Promise<PaginatedResult<Organization>> {
  return getPaginated<Organization>("/organizations", {
    params: { limit: 50, ...filters },
  });
}

export function getOrganization(id: number): Promise<Organization> {
  return getData<Organization>(`/organizations/${id}`);
}

export function updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
  return patchData<Organization>(`/organizations/${id}`, data);
}

export function deleteOrganization(id: number): Promise<void> {
  return deleteData(`/organizations/${id}`);
}
