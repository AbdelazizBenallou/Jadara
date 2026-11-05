import axios from "axios";

export type ApiErrorCode =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limited"
  | "server"
  | "unknown";

export interface ApiErrorOptions {
  status?: number;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: ApiErrorCode = "unknown",
    options: ApiErrorOptions = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

const STATUS_CODE_MAP: Record<number, ApiErrorCode> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation",
  429: "rate_limited",
};

export function codeFromStatus(status?: number): ApiErrorCode {
  if (status == null) return "unknown";
  if (STATUS_CODE_MAP[status]) return STATUS_CODE_MAP[status];
  if (status >= 500) return "server";
  return "unknown";
}

interface ServerErrorBody {
  message?: unknown;
  details?: unknown;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as ServerErrorBody | string | undefined;
    const serverMessage =
      body && typeof body === "object" && typeof body.message === "string"
        ? body.message
        : typeof body === "string"
          ? body
          : undefined;

    if (!error.response) {
      const code: ApiErrorCode =
        error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
          ? "timeout"
          : "network";
      return new ApiError(serverMessage ?? error.message, code, {
        cause: error,
      });
    }

    return new ApiError(
      serverMessage ?? error.message,
      codeFromStatus(status),
      {
        status,
        details: body,
        cause: error,
      },
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message, "unknown", { cause: error });
  }

  return new ApiError(
    typeof error === "string" ? error : "Unknown error",
    "unknown",
  );
}

export function isUnauthorizedError(error: unknown): boolean {
  return toApiError(error).code === "unauthorized";
}
