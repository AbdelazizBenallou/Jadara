import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import type { Language } from "@/types/cv";

export async function listLanguages(
  filters?: { limit?: number; page?: number; search?: string },
  config?: AxiosRequestConfig,
): Promise<Language[]> {
  const result = await getPaginated<Language>("/languages", {
    ...config,
    params: { limit: 100, ...filters },
  });
  return result.items;
}

export function getLanguage(id: number): Promise<Language> {
  return getData<Language>(`/languages/${id}`);
}

export function createLanguage(data: { name: string; code?: string | null; status?: string }): Promise<Language> {
  return postData<Language>("/languages", data);
}

export function updateLanguage(id: number, data: { name?: string; code?: string | null; status?: string }): Promise<Language> {
  return patchData<Language>(`/languages/${id}`, data);
}

export function deleteLanguage(id: number): Promise<void> {
  return deleteData(`/languages/${id}`);
}
