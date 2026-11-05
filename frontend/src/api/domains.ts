import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated, patchData, postData, putData } from "./http";
import type {
  Domain,
  DomainDetail,
  DomainInput,
  DomainReviewer,
  SubDomain,
  SubDomainInput,
} from "@/types/domain";
import type { Skill } from "@/types/skill";

export type DomainId = number | string;

export interface DomainFilters {
  limit?: number;
  page?: number;
  search?: string;
}

export async function listDomains(
  filters?: DomainFilters,
  config?: AxiosRequestConfig,
): Promise<Domain[]> {
  const result = await getPaginated<Domain>("/domains", {
    ...config,
    params: filters,
  });
  return result.items;
}

export function getDomain(id: DomainId): Promise<DomainDetail> {
  return getData<DomainDetail>(`/domains/${id}`);
}

export function getDomainSkills(id: DomainId): Promise<Skill[]> {
  return getData<Skill[]>(`/domains/${id}/skills`);
}

export interface DomainReviewersResponse {
  id: number;
  name: string;
  reviewers: DomainReviewer[];
}

export function getDomainReviewers(
  id: DomainId,
): Promise<DomainReviewersResponse> {
  return getData<DomainReviewersResponse>(`/domains/${id}/reviewers`);
}

export interface SubDomainFilters {
  domain_id?: DomainId;
  search?: string;
  limit?: number;
  page?: number;
}

export async function getSubDomains(id: DomainId): Promise<SubDomain[]> {
  const result = await getPaginated<SubDomain>("/domains/sub-domains", {
    params: { domain_id: id, limit: 100 },
  });
  return result.items;
}

export async function listAllSubDomains(
  filters?: SubDomainFilters,
  config?: AxiosRequestConfig,
): Promise<SubDomain[]> {
  const result = await getPaginated<SubDomain>("/domains/sub-domains", {
    ...config,
    params: { limit: 150, ...filters },
  });
  return result.items;
}

export function createDomain(input: DomainInput): Promise<Domain> {
  return postData<Domain>("/domains", { ...input });
}

export function updateDomain(
  id: DomainId,
  input: Partial<DomainInput>,
): Promise<Domain> {
  return patchData<Domain>(`/domains/${id}`, { ...input });
}

export function deleteDomain(id: DomainId): Promise<void> {
  return deleteData(`/domains/${id}`);
}

export function createSubDomain(input: SubDomainInput): Promise<SubDomain> {
  return postData<SubDomain>("/domains/sub-domains", { ...input });
}

export function updateSubDomain(
  id: DomainId,
  input: Partial<SubDomainInput>,
): Promise<SubDomain> {
  return patchData<SubDomain>(`/domains/sub-domains/${id}`, { ...input });
}

export function deleteSubDomain(id: DomainId): Promise<void> {
  return deleteData(`/domains/sub-domains/${id}`);
}

export function setReviewerDomains(
  userId: number,
  domainId: number,
): Promise<void> {
  return putData<void>(`/users/${userId}/review-domains`, {
    domain_id: domainId,
  });
}

export function removeReviewerDomain(
  userId: number,
  domainId: DomainId,
): Promise<void> {
  return deleteData(`/users/${userId}/review-domains/${domainId}`);
}
