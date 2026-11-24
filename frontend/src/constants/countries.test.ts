import { describe, expect, it } from "vitest"
import {
  COUNTRIES,
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  getCountryLabel,
  isValidCountryCode,
  normalizeCountryCode,
} from "./countries"

describe("countries constants and utilities", () => {
  it("provides standard country options", () => {
    expect(COUNTRY_OPTIONS.length).toBe(COUNTRIES.length)
    expect(DEFAULT_COUNTRY).toBe("MM")
  })

  it("validates country codes accurately", () => {
    expect(isValidCountryCode("MM")).toBe(true)
    expect(isValidCountryCode("mm")).toBe(true)
    expect(isValidCountryCode("th")).toBe(true)
    expect(isValidCountryCode("SG")).toBe(true)
    expect(isValidCountryCode("Myanmar123!@#")).toBe(false)
    expect(isValidCountryCode("Myanmar12")).toBe(false)
    expect(isValidCountryCode("")).toBe(false)
    expect(isValidCountryCode(null)).toBe(false)
  })

  it("normalizes bad values from legacy entries (BUG-02)", () => {
    expect(normalizeCountryCode("Myanmar12")).toBe("MM")
    expect(normalizeCountryCode("Myanmar 69")).toBe("MM")
    expect(normalizeCountryCode("မြန်မာ")).toBe("MM")
    expect(normalizeCountryCode("thailand")).toBe("TH")
    expect(normalizeCountryCode("singapore")).toBe("SG")
    expect(normalizeCountryCode("unknown-country")).toBe("MM")
    expect(normalizeCountryCode("")).toBe("MM")
    expect(normalizeCountryCode(null)).toBe("MM")
  })

  it("formats country labels nicely including for legacy values", () => {
    expect(getCountryLabel("MM")).toBe("Myanmar (MM)")
    expect(getCountryLabel("Myanmar12")).toBe("Myanmar (MM)")
    expect(getCountryLabel("မြန်မာ")).toBe("Myanmar (MM)")
    expect(getCountryLabel("TH")).toBe("Thailand (TH)")
    expect(getCountryLabel("")).toBe("—")
    expect(getCountryLabel(null)).toBe("—")
  })
})
