import axios from "axios";

// Assume the backend is hosted at the same origin + /api, or read from env.
// For local dev, Vite proxy can handle /api -> localhost:3000
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Flag to prevent multiple concurrent refresh requests
let isRefreshing = false;
// Queue for requests that were intercepted while refreshing
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and it's not already a retry, and it's not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh-token"
    ) {
      if (isRefreshing) {
        // If already refreshing, wait in the queue
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return apiClient(originalRequest); // Retry original request once refresh resolves
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh-token");
        processQueue(null);
        return apiClient(originalRequest); // Retry original request
      } catch (refreshError: unknown) {
        processQueue(refreshError);
        // Clear local auth state (e.g., dispatch an event or rely on AuthContext polling/initialization to fail)
        window.dispatchEvent(new Event("auth-refresh-failed"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
