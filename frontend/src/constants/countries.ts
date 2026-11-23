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

export const COUNTRY_OPTIONS: FormFieldOption[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.name} (${c.code})`,
}))

export function getCountryLabel(code?: string | null): string {
  if (!code) {
    return "—"
  }
  const found = COUNTRIES.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase()
  )
  return found ? `${found.name} (${found.code})` : code
}
