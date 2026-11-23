import type { FormFieldOption } from "@/components/common/form/form-field"

export interface CountryInfo {
  code: string
  name: string
  phoneCode: string
}

export const COUNTRIES: CountryInfo[] = [
  { code: "MM", name: "Myanmar", phoneCode: "+95" },
  { code: "TH", name: "Thailand", phoneCode: "+66" },
  { code: "SG", name: "Singapore", phoneCode: "+65" },
  { code: "MY", name: "Malaysia", phoneCode: "+60" },
  { code: "VN", name: "Vietnam", phoneCode: "+84" },
  { code: "ID", name: "Indonesia", phoneCode: "+62" },
  { code: "PH", name: "Philippines", phoneCode: "+63" },
  { code: "CN", name: "China", phoneCode: "+86" },
  { code: "JP", name: "Japan", phoneCode: "+81" },
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
]

export const DEFAULT_COUNTRY = "MM"

export const COUNTRY_OPTIONS: FormFieldOption[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.name} (${c.code})`,
}))

export function isValidCountryCode(code?: string | null): boolean {
  if (!code) {
    return false
  }
  const upper = code.trim().toUpperCase()
  return COUNTRIES.some((c) => c.code === upper)
}

/**
 * Normalizes any raw country input (including legacy bad values like "Myanmar12", "Myanmar 69", "မြန်မာ")
 * into a valid ISO country code from the fixed list.
 */
export function normalizeCountryCode(code?: string | null): string {
  if (!code) {
    return DEFAULT_COUNTRY
  }

  const trimmed = code.trim()
  const upper = trimmed.toUpperCase()
  if (COUNTRIES.some((c) => c.code === upper)) {
    return upper
  }

  const lower = trimmed.toLowerCase()
  if (
    lower.includes("myanmar") ||
    trimmed.includes("မြန်မာ") ||
    lower.includes("burma")
  ) {
    return "MM"
  }
  if (lower.includes("thailand") || lower.includes("thai")) {
    return "TH"
  }
  if (lower.includes("singapore")) {
    return "SG"
  }
  if (lower.includes("malaysia")) {
    return "MY"
  }
  if (lower.includes("vietnam")) {
    return "VN"
  }
  if (lower.includes("indonesia")) {
    return "ID"
  }
  if (lower.includes("philippines")) {
    return "PH"
  }
  if (lower.includes("china")) {
    return "CN"
  }
  if (lower.includes("japan")) {
    return "JP"
  }
  if (lower.includes("united states") || lower.includes("usa")) {
    return "US"
  }
  if (lower.includes("united kingdom") || lower.includes("uk")) {
    return "GB"
  }

  return DEFAULT_COUNTRY
}

export function getCountryLabel(code?: string | null): string {
  if (!code) {
    return "—"
  }
  const normalized = normalizeCountryCode(code)
  const found = COUNTRIES.find((c) => c.code === normalized)
  return found ? `${found.name} (${found.code})` : code
}
