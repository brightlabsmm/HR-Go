import { describe, expect, it } from "vitest"

import { PASSWORD_PATTERN } from "@/constants/timezones"
import { generateTemporaryPassword } from "@/util/password"

describe("generateTemporaryPassword", () => {
  it("meets the temporary password policy", () => {
    for (let index = 0; index < 20; index += 1) {
      const password = generateTemporaryPassword()
      expect(password).toMatch(PASSWORD_PATTERN)
      expect(password).toHaveLength(12)
    }
  })
})
