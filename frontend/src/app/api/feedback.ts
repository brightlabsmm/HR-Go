import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form"

import { i18n } from "@/app/i18n"
import { API_ERROR_CODES } from "@/app/api/codes"
import { ApiError } from "@/app/api/types"
import { toast } from "@/shared/stores/toast.store"

const ERROR_DEDUPE_MS = 4000

let lastErrorToast = ""
let lastErrorToastAt = 0

export type ApiFeedbackSource = "query" | "mutation"

function genericErrorMessage() {
  return i18n.t("errors.generic", { ns: "common" })
}

function networkErrorMessage() {
  return i18n.t("errors.network", { ns: "common" })
}

export function getApiSuccessMessage(data: unknown) {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return undefined
  }

  const message = data.message
  if (typeof message !== "string") {
    return undefined
  }

  const trimmed = message.trim()
  return trimmed === "" ? undefined : trimmed
}

export function getApiErrorMessage(
  error: unknown,
  source: ApiFeedbackSource = "mutation"
) {
  if (!(error instanceof ApiError)) {
    return genericErrorMessage()
  }

  if (error.code === API_ERROR_CODES.NETWORK_ERROR || error.status === 0) {
    return networkErrorMessage()
  }

  if (error.code === API_ERROR_CODES.FORBIDDEN || error.status === 403) {
    return i18n.t("errors.forbidden", { ns: "common" })
  }

  if (
    (error.code === API_ERROR_CODES.VALIDATION_ERROR || error.status === 422) &&
    error.details.length > 0
  ) {
    if (source === "query") {
      return error.details.map((detail) => detail.message).join(" ")
    }

    return undefined
  }

  const trimmed = error.message.trim()
  return trimmed === "" ? genericErrorMessage() : trimmed
}

function pushErrorToast(message: string) {
  const now = Date.now()
  if (message === lastErrorToast && now - lastErrorToastAt < ERROR_DEDUPE_MS) {
    return
  }

  lastErrorToast = message
  lastErrorToastAt = now
  toast.error(message)
}

export function notifyApiError(
  error: unknown,
  options?: { source?: ApiFeedbackSource }
) {
  const message = getApiErrorMessage(error, options?.source ?? "mutation")
  if (!message) {
    return
  }

  pushErrorToast(message)
}

export function notifyApiSuccess(data: unknown) {
  const message = getApiSuccessMessage(data)
  if (!message) {
    return
  }

  toast.success(message)
}

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldNames?: ReadonlySet<string>
) {
  if (!(error instanceof ApiError)) {
    return false
  }

  let applied = false

  for (const issue of error.details) {
    if (fieldNames && !fieldNames.has(issue.field)) {
      continue
    }

    setError(issue.field as FieldPath<TFieldValues>, { message: issue.message })
    applied = true
  }

  return applied
}
