import type { ApiErrorCode } from "./api-error";

const ERROR_KEYS: Record<ApiErrorCode, string> = {
  network: "errors.network",
  timeout: "errors.timeout",
  unauthorized: "errors.unauthorized",
  forbidden: "errors.forbidden",
  not_found: "errors.notFound",
  conflict: "errors.conflict",
  validation: "errors.validation",
  rate_limited: "errors.rateLimited",
  server: "errors.server",
  unknown: "errors.unknown",
};

const SERVER_MESSAGE_CODES: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  "validation",
  "conflict",
  "not_found",
  "forbidden",
]);

export function apiErrorKey(code: ApiErrorCode): string {
  return ERROR_KEYS[code];
}

export function prefersServerMessage(code: ApiErrorCode): boolean {
  return SERVER_MESSAGE_CODES.has(code);
}
