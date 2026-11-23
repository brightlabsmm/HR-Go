export const DEFAULT_TIMEZONE = "Asia/Yangon"

export function formatDateTime(
  value: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DEFAULT_TIMEZONE,
    ...options,
  }).format(date)
}

export function formatMonth(
  month: number,
  locale: string,
  options?: Intl.DateTimeFormatOptions
) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "—"
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: DEFAULT_TIMEZONE,
    ...options,
  }).format(new Date(Date.UTC(2000, month - 1, 15)))
}

export function formatDate(
  value: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: DEFAULT_TIMEZONE,
    ...options,
  }).format(date)
}
