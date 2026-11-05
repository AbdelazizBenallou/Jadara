import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import type { PaginatedResult } from "@/types/api";

export interface ActivityCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function listActivityCategories(): Promise<ActivityCategory[]> {
  const result = await getPaginated<ActivityCategory>("/activity-categories", {
    params: { limit: 100 },
  });
  return result.items;
}

export function getActivityCategory(id: number): Promise<ActivityCategory> {
  return getData<ActivityCategory>(`/activity-categories/${id}`);
}

export function createActivityCategory(data: { name: string; description?: string | null }): Promise<ActivityCategory> {
  return postData<ActivityCategory>("/activity-categories", data);
}

export function updateActivityCategory(id: number, data: { name?: string; description?: string | null }): Promise<ActivityCategory> {
  return patchData<ActivityCategory>(`/activity-categories/${id}`, data);
}

export function deleteActivityCategory(id: number): Promise<void> {
  return deleteData(`/activity-categories/${id}`);
}
