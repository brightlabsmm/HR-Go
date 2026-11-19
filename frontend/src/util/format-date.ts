export function formatDateTime(value: string | null | undefined, locale: string) {
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
  }).format(date)
}

export function formatMonth(month: number, locale: string) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "—"
  }

  return new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(2000, month - 1, 1)
  )
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}
