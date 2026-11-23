import type { TFunction } from "i18next"

import { API_ERROR_CODES } from "@/app/api/codes"
import { ApiError } from "@/app/api/types"

export interface AuthErrorAlertContent {
  title: string
  description?: string
}

export function getAuthErrorAlert(
  error: unknown,
  t: TFunction<"auth">
): AuthErrorAlertContent {
  const fallback = { title: t("login.error_generic") }

  if (!(error instanceof ApiError)) {
    return fallback
  }

  if (error.status === 403) {
    return {
      title: t("login.error_suspended_title"),
      description: t("login.error_contact_admin"),
    }
  }

  if (error.status === 401) {
    return {
      title: t(
        "login.error_invalid_credentials",
        "Invalid employee identifier or password."
      ),
    }
  }

  if (
    (error.code === API_ERROR_CODES.VALIDATION_ERROR || error.status === 422) &&
    error.details.length > 0
  ) {
    const issues = error.details.map((detail) => detail.message)
    return {
      title: issues[0] ?? fallback.title,
      description: issues.slice(1).join(" ") || undefined,
    }
  }

  const title = error.message.trim()
  return title === "" ? fallback : { title }
}
