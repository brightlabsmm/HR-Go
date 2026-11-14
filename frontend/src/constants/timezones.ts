export const TIMEZONE_OPTIONS = [
  { value: "Asia/Yangon", label: "Asia/Yangon" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "UTC", label: "UTC" },
] as const

export const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
] as const

export const FISCAL_MONTH_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
] as const

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
