import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated } from "./http";
import type { PaginatedResult } from "@/types/api";
import type { DocumentRecord } from "@/types/document";

export type DocumentId = number | string;

export interface DocumentFilters {
  limit?: number;
  page?: number;
  type?: string;
}

export function listDocuments(
  filters?: DocumentFilters,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<DocumentRecord>> {
  return getPaginated<DocumentRecord>("/documents", {
    ...config,
    params: filters,
  });
}

export function getDocument(id: DocumentId): Promise<DocumentRecord> {
  return getData<DocumentRecord>(`/documents/${id}`);
}

export function deleteDocument(id: DocumentId): Promise<void> {
  return deleteData(`/documents/${id}`);
}
