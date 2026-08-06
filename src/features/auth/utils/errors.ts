import { AUTH_ERROR_MESSAGES } from "@/constants/auth";

export function getFriendlyAuthError(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? "Não foi possível concluir. Tente novamente em instantes.";
}

export function getSafeNextPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
