import type { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { toApiError } from "@/lib/api-error";
import type {
  ApiEnvelope,
  PaginatedEnvelope,
  PaginatedResult,
  RequestBody,
} from "@/types/api";

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getEnvelope<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiEnvelope<T>> {
  try {
    const response = await apiClient.get<ApiEnvelope<T>>(url, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export function getData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: "get", url });
}

export function postData<T>(
  url: string,
  body?: RequestBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: "post", url, data: body });
}

export function putData<T>(
  url: string,
  body?: RequestBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: "put", url, data: body });
}

export function patchData<T>(
  url: string,
  body?: RequestBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: "patch", url, data: body });
}

export function deleteData<T = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return request<T>({ ...config, method: "delete", url });
}

export async function getPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<T>> {
  try {
    const response = await apiClient.get<PaginatedEnvelope<T>>(url, config);
    return { items: response.data.data ?? [], meta: response.data.meta };
  } catch (error) {
    throw toApiError(error);
  }
}
