import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated, postData, patchData } from "./http";
import type { Project } from "@/types/project";

export type ProjectId = number | string;

export interface ProjectFilters {
  limit?: number;
  page?: number;
  status?: string;
  search?: string;
}

export interface ProjectInput {
  title: string;
  description?: string;
  github_url?: string | null;
  live_url?: string | null;
  figma_url?: string | null;
  sub_domain_id?: number | null;
}

export type ProjectUpdateInput = Partial<ProjectInput>;

export async function listProjects(
  filters?: ProjectFilters,
  config?: AxiosRequestConfig,
): Promise<Project[]> {
  const result = await getPaginated<Project>("/projects", {
    ...config,
    params: { limit: 100, ...filters },
  });
  return result.items;
}

export async function listAdminProjects(
  filters?: ProjectFilters,
  config?: AxiosRequestConfig,
): Promise<Project[]> {
  const result = await getPaginated<Project>("/projects/all", {
    ...config,
    params: { limit: 100, ...filters },
  });
  return result.items;
}

export function getProject(id: ProjectId): Promise<Project> {
  return getData<Project>(`/projects/${id}`);
}

export function getAdminProject(id: ProjectId): Promise<Project> {
  return getData<Project>(`/projects/${id}/admin`);
}

export async function getProjectsByUser(
  userId: ProjectId,
): Promise<Project[]> {
  const result = await getPaginated<Project>(`/projects/user/${userId}`, {
    params: { limit: 100 },
  });
  return result.items;
}

export function createProject(input: ProjectInput): Promise<Project> {
  return postData<Project>("/projects", { ...input });
}

export function updateProject(
  id: ProjectId,
  input: ProjectUpdateInput,
): Promise<Project> {
  return patchData<Project>(`/projects/${id}`, { ...input });
}

export function deleteProject(id: ProjectId): Promise<void> {
  return deleteData(`/projects/${id}`);
}

export function deleteAdminProject(id: ProjectId): Promise<void> {
  return deleteData(`/projects/${id}/admin`);
}

export function submitProject(id: ProjectId): Promise<Project> {
  return postData<Project>(`/projects/${id}/submit`);
}

export function forceProjectStatus(
  id: ProjectId,
  status: Project["status"],
): Promise<Project> {
  return patchData<Project>(`/projects/${id}/status`, { status });
}

export function uploadEvidence(
  id: ProjectId,
  file: File,
  fields?: Record<string, string>,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(fields ?? {}).forEach(([key, value]) =>
    formData.append(key, value),
  );

  return postData<unknown>(`/projects/${id}/evidence`, formData);
}

export function linkEvidence(
  id: ProjectId,
  documentId: number,
): Promise<unknown> {
  return postData<unknown>(`/projects/${id}/evidence/link`, {
    document_id: documentId,
  });
}

export function removeEvidence(
  id: ProjectId,
  evidenceId: ProjectId,
): Promise<void> {
  return deleteData(`/projects/${id}/evidence/${evidenceId}`);
}
