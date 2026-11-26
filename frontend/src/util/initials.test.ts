import { describe, expect, it } from "vitest"

import { getInitials } from "@/util/initials"

describe("getInitials", () => {
  it("skips punctuation-only tokens such as '&'", () => {
    expect(getInitials(..."Executive & Governance".split(" "))).toBe("EG")
  })

  it("handles Unicode letters and missing values", () => {
    expect(getInitials("Aung", "Kyaw")).toBe("AK")
    expect(getInitials("", "   ")).toBe("?")
  })
})
