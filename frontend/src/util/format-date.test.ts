import { describe, expect, it } from "vitest"

import {
  DEFAULT_TIMEZONE,
  formatDate,
  formatDateTime,
  formatMonth,
} from "./format-date"

describe("formatDate and formatDateTime (BUG-09)", () => {
  it("defaults to Asia/Yangon timezone", () => {
    expect(DEFAULT_TIMEZONE).toBe("Asia/Yangon")
  })

  it("handles nil, undefined, and empty string safely", () => {
    expect(formatDate(null, "en")).toBe("—")
    expect(formatDate(undefined, "en")).toBe("—")
    expect(formatDate("", "en")).toBe("—")
    expect(formatDateTime(null, "en")).toBe("—")
    expect(formatDateTime(undefined, "en")).toBe("—")
    expect(formatDateTime("", "en")).toBe("—")
  })

  it("returns invalid date strings as-is", () => {
    expect(formatDate("not-a-date", "en")).toBe("not-a-date")
    expect(formatDateTime("not-a-date", "en")).toBe("not-a-date")
  })

  it("formats dates according to Asia/Yangon timezone (+06:30)", () => {
    // 2026-11-23 20:00:00 UTC is 2026-11-24 02:30:00 in Asia/Yangon (+06:30)
    const utcIso = "2026-11-23T20:00:00Z"
    const formatted = formatDate(utcIso, "en-US")
    expect(formatted).toContain("Nov 24, 2026")
  })

  it("formats date and time in Asia/Yangon timezone", () => {
    // 2026-11-23 05:30:00 UTC is 2026-11-23 12:00:00 PM in Asia/Yangon (+06:30)
    const utcIso = "2026-11-23T05:30:00Z"
    const formatted = formatDateTime(utcIso, "en-US")
    expect(formatted).toContain("Nov 23, 2026")
    expect(formatted).toMatch(/12:00\s*PM/i)
  })

  it("allows custom timezone override if specified in options", () => {
    // 2026-11-23 20:00:00 UTC is still Nov 23 in UTC
    const utcIso = "2026-11-23T20:00:00Z"
    const formattedUtc = formatDate(utcIso, "en-US", { timeZone: "UTC" })
    expect(formattedUtc).toContain("Nov 23, 2026")
  })

  it("formats valid months and rejects invalid ones", () => {
    expect(formatMonth(1, "en-US")).toBe("January")
    expect(formatMonth(12, "en-US")).toBe("December")
    expect(formatMonth(0, "en-US")).toBe("—")
    expect(formatMonth(13, "en-US")).toBe("—")
  })
})
