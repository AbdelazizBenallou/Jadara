import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import type {
  Skill,
  SkillCategory,
  SkillInput,
  UserSkill,
  UserSkillInput,
} from "@/types/skill";

export type SkillId = number | string;

export interface SkillFilters {
  limit?: number;
  page?: number;
  search?: string;
  category_id?: number;
}

export async function listSkills(
  filters?: SkillFilters,
  config?: AxiosRequestConfig,
): Promise<Skill[]> {
  const result = await getPaginated<Skill>("/skills", {
    ...config,
    params: filters,
  });
  return result.items;
}

export async function listSkillCategories(
  filters?: { limit?: number },
  config?: AxiosRequestConfig,
): Promise<SkillCategory[]> {
  const result = await getPaginated<SkillCategory>("/skills/categories", {
    ...config,
    params: filters,
  });
  return result.items;
}

export function getDomainSkills(
  domainId: SkillId,
  config?: AxiosRequestConfig,
): Promise<Skill[]> {
  return getData<Skill[]>(`/domains/${domainId}/skills`, config);
}

export function getMySkills(): Promise<UserSkill[]> {
  return getData<UserSkill[]>("/users/me/skills");
}

export function getUserSkills(userId: SkillId): Promise<UserSkill[]> {
  return getData<UserSkill[]>(`/users/${userId}/skills`);
}

export function addMySkills(skills: UserSkillInput[]): Promise<UserSkill[]> {
  return postData<UserSkill[]>("/users/me/skills", { skills });
}

export function addUserSkill(
  userId: SkillId,
  input: UserSkillInput,
): Promise<unknown> {
  return postData<unknown>(`/users/${userId}/skills`, {
    skills: [{ ...input }],
  });
}

export function updateMySkill(
  id: SkillId,
  input: Partial<UserSkillInput>,
): Promise<UserSkill> {
  return patchData<UserSkill>(`/users/me/skills/${id}`, { ...input });
}

export function removeMySkill(id: SkillId): Promise<void> {
  return deleteData(`/users/me/skills/${id}`);
}

export function removeUserSkill(userId: SkillId, id: SkillId): Promise<void> {
  return deleteData(`/users/${userId}/skills/${id}`);
}

export function createSkill(input: SkillInput): Promise<Skill> {
  return postData<Skill>("/skills", { ...input });
}

export function updateSkill(
  id: SkillId,
  input: Partial<SkillInput>,
): Promise<Skill> {
  return patchData<Skill>(`/skills/${id}`, { ...input });
}

export function deleteSkill(id: SkillId): Promise<void> {
  return deleteData(`/skills/${id}`);
}

export function createSkillCategory(input: {
  name: string;
  description?: string;
}): Promise<SkillCategory> {
  return postData<SkillCategory>("/skills/categories", { ...input });
}

export function deleteSkillCategory(id: SkillId): Promise<void> {
  return deleteData(`/skills/categories/${id}`);
}

export function attachSkillsToDomain(
  domainId: SkillId,
  skillIds: number[],
): Promise<void> {
  return postData<void>(`/domains/${domainId}/skills`, { skill_ids: skillIds });
}
