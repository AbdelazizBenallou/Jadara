import axios, { type InternalAxiosRequestConfig } from "axios";

// Fall back to backend port 3001 if VITE_API_URL is unset
const getBaseApiUrl = (): string => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "http://localhost:3001";
};

const API_BASE_URL = `${getBaseApiUrl().replace(/\/+$/, "")}/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Dedicated Axios instance for refresh calls to avoid interceptor recursion
export const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Shared promise to ensure concurrent 401s trigger exactly one refresh operation
let refreshPromise: Promise<void> | null = null;

export async function refreshSession(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Must pass empty object {} so Express express.json() populates req.body for zodValidate
      await refreshClient.post("/auth/refresh-token", {});
    } catch (error: unknown) {
      if (typeof window !== "undefined") {
        const axiosErr = error as { response?: { status?: number } };
        // Broadcast refresh failure if server rejected token (401 unauthorized, 403 forbidden, 422 missing token)
        const status = axiosErr.response?.status;
        if (status === 401 || status === 403 || status === 422) {
          window.dispatchEvent(new Event("auth-refresh-failed"));
        }
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Endpoints that must never trigger automatic token refresh
function shouldSkipRefresh(config?: InternalAxiosRequestConfig & { _skipAuthRefresh?: boolean }): boolean {
  if (!config) return false;
  if (config._skipAuthRefresh) return true;
  if (!config.url) return false;

  const cleanUrl = config.url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith("/auth/login") ||
    cleanUrl.endsWith("/auth/register") ||
    cleanUrl.endsWith("/auth/refresh-token")
  );
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 1. If request was cancelled, do not attempt refresh
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _skipAuthRefresh?: boolean }) | undefined;

    // 2. Only attempt refresh on 401 Unauthorized for eligible requests that haven't retried yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest)
    ) {
      // Mark as retried immediately so this specific request cannot trigger another refresh attempt
      originalRequest._retry = true;

      try {
        // Wait for active refresh or trigger a new one
        await refreshSession();
        // Retry the original request with the freshly issued cookies
        return apiClient(originalRequest);
      } catch {
        // When refresh fails, propagate the original request error to the caller
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

