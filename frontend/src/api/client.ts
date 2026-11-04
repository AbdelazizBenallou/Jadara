import axios, { type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const REQUEST_TIMEOUT_MS = 20_000;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _networkRetry?: boolean;
}

export const apiClient = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const isAuthRequest = (url?: string) => Boolean(url?.startsWith("/auth/"));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function emitSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth-refresh-failed"));
  window.dispatchEvent(new Event("auth:session-expired"));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url)
    ) {
      if (isRefreshing) {
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return apiClient(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh-token");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        emitSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const method = (originalRequest?.method ?? "get").toLowerCase();
    if (
      !error.response &&
      originalRequest &&
      !originalRequest._networkRetry &&
      (method === "get" || method === "head")
    ) {
      originalRequest._networkRetry = true;
      await delay(300);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
