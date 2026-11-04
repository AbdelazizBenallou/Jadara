import type { AxiosRequestConfig } from "axios";
import { getData, getPaginated, postData } from "./http";
import type { Demand, DemandDecisionInput } from "@/types/demand";
import type { PaginatedResult } from "@/types/api";

export type DemandId = number | string;

export interface DemandFilters {
  limit?: number;
  page?: number;
  status?: string;
}

export function listDemands(
  filters?: DemandFilters,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<Demand>> {
  return getPaginated<Demand>("/demands", { ...config, params: filters });
}

export function getDemand(id: DemandId): Promise<Demand> {
  return getData<Demand>(`/demands/${id}`);
}

export function approveDemand(
  id: DemandId,
  input?: DemandDecisionInput,
): Promise<void> {
  return postData<void>(`/demands/${id}/approve`, { ...input });
}

export function rejectDemand(
  id: DemandId,
  input?: DemandDecisionInput,
): Promise<void> {
  return postData<void>(`/demands/${id}/reject`, { ...input });
}

export function resendDemandNotification(id: DemandId): Promise<void> {
  return postData<void>(`/demands/${id}/resend-notification`);
}
