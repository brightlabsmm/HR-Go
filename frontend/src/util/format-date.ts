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

export function formatLocalDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function localDateTimeToIso(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) {
    return null
  }
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    return null
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString()
}

export function formatTime(
  value: string | null | undefined,
  locale = "en"
): string {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.includes("T") ? value.split("T")[1].slice(0, 5) : value
  }
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DEFAULT_TIMEZONE,
  }).format(date)
}
