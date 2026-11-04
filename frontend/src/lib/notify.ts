import { toast } from "sonner";
import i18n from "@/i18n";
import { toApiError } from "./api-error";
import { apiErrorKey, prefersServerMessage } from "./error-messages";

export function getErrorMessage(
  error: unknown,
  fallbackKey = "error.desc",
): string {
  const apiError = toApiError(error);

  if (apiError.message && prefersServerMessage(apiError.code)) {
    return apiError.message;
  }

  const fallback = i18n.exists(fallbackKey)
    ? i18n.t(fallbackKey)
    : i18n.t("errors.unknown");

  return i18n.t(apiErrorKey(apiError.code), { defaultValue: fallback });
}

export function notifyError(error: unknown, fallbackKey = "error.desc"): void {
  toast.error(getErrorMessage(error, fallbackKey));
}

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyInfo(message: string): void {
  toast.info(message);
}

export function notifyWarning(message: string): void {
  toast.warning(message);
}
