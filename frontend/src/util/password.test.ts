import { describe, expect, it } from "vitest"

import { PASSWORD_PATTERN } from "@/constants/timezones"
import { generateTemporaryPassword, isCommonPassword } from "@/util/password"

describe("generateTemporaryPassword", () => {
  it("meets the temporary password policy", () => {
    for (let index = 0; index < 20; index += 1) {
      const password = generateTemporaryPassword()
      expect(password).toMatch(PASSWORD_PATTERN)
      expect(password).toHaveLength(12)
      expect(isCommonPassword(password)).toBe(false)
    }
  })
})

describe("isCommonPassword", () => {
  it("identifies common weak passwords", () => {
    expect(isCommonPassword("12345678")).toBe(true)
    expect(isCommonPassword("password")).toBe(true)
    expect(isCommonPassword("Password123")).toBe(true)
    expect(isCommonPassword("admin123")).toBe(true)
    expect(isCommonPassword("Admin123")).toBe(true)
  })

  it("permits strong non-common passwords", () => {
    expect(isCommonPassword("SecureP@ss2026!")).toBe(false)
    expect(isCommonPassword("MyUn1queKey#1")).toBe(false)
  })
})
