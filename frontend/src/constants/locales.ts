export const SUPPORTED_LOCALES = ["en", "my"] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "en"

export const LOCALE_STORAGE_KEY = "hr-go-locale"

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  )
}
