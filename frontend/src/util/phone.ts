const E164_PATTERN = /^\+[1-9]\d{7,14}$/

export interface PhoneDialCode {
  phoneCode: string
  isoCode: string
  name: string
}

export interface SplitPhone {
  phoneCode: string
  national: string
}

function compactPhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "")
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

export function normalizePhoneCode(code: string) {
  const digits = digitsOnly(code)
  return digits ? `+${digits}` : ""
}

export function isValidE164Phone(value: string) {
  return E164_PATTERN.test(compactPhone(value))
}

export function isOptionalE164Phone(value: string) {
  return compactPhone(value) === "" || isValidE164Phone(value)
}

export function isValidBranchPhone(value: string) {
  const compact = compactPhone(value)
  if (!compact) {
    return true
  }

  if (isValidE164Phone(compact)) {
    return true
  }

  const digits = digitsOnly(compact)
  return digits.length >= 8 && digits.length <= 15
}

export function toE164Phone(value: string, phoneCode: string) {
  const compact = compactPhone(value)
  if (!compact) {
    return undefined
  }

  if (compact.startsWith("+")) {
    return compact
  }

  let digits = digitsOnly(compact)
  const codeDigits = digitsOnly(phoneCode)

  if (digits.startsWith("0")) {
    digits = digits.slice(1)
  }

  if (!digits) {
    return undefined
  }

  if (codeDigits && digits.startsWith(codeDigits)) {
    return `+${digits}`
  }

  return `+${codeDigits}${digits}`
}

export function uniqueDialCodes(
  countries: Array<{ phone_code: string; iso_code: string; name: string }>
): PhoneDialCode[] {
  const codes = new Map<string, PhoneDialCode>()

  for (const country of countries) {
    const phoneCode = normalizePhoneCode(country.phone_code)
    if (!phoneCode || codes.has(phoneCode)) {
      continue
    }

    codes.set(phoneCode, {
      phoneCode,
      isoCode: country.iso_code.toUpperCase(),
      name: country.name,
    })
  }

  return [...codes.values()].sort((left, right) =>
    left.phoneCode.localeCompare(right.phoneCode)
  )
}

export function splitPhone(
  value: string,
  phoneCodes: string[],
  fallbackCode: string
): SplitPhone {
  const compact = compactPhone(value)
  const normalizedFallback =
    normalizePhoneCode(fallbackCode) ||
    normalizePhoneCode(phoneCodes[0] ?? "") ||
    "+95"
  const sortedCodes = [...phoneCodes]
    .map(normalizePhoneCode)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)

  if (!compact) {
    return { phoneCode: normalizedFallback, national: "" }
  }

  if (compact.startsWith("+")) {
    const digits = digitsOnly(compact)

    for (const code of sortedCodes) {
      const codeDigits = digitsOnly(code)
      if (codeDigits && digits.startsWith(codeDigits)) {
        return {
          phoneCode: `+${codeDigits}`,
          national: digits.slice(codeDigits.length),
        }
      }
    }

    return { phoneCode: normalizedFallback, national: digits }
  }

  return { phoneCode: normalizedFallback, national: digitsOnly(compact) }
}
