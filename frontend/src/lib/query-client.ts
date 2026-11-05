import { QueryClient } from "@tanstack/react-query";
import { toApiError } from "./api-error";

function shouldRetry(failureCount: number, error: unknown): boolean {
  const code = toApiError(error).code;
  if (code === "network" || code === "timeout" || code === "server") {
    return failureCount < 2;
  }
  return false;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
