import { describe, expect, it } from "vitest"

import { validateSuspendInput } from "./organization-suspend-dialog"

describe("validateSuspendInput", () => {
  const baseNow = new Date("2026-11-23T12:00:00Z").getTime()

  it("requires confirmation checkbox to be checked", () => {
    const res = validateSuspendInput({
      confirmed: false,
      mode: "immediate",
      now: baseNow,
    })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/confirm/i)
  })

  it("validates immediate mode successfully when confirmed", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "immediate",
      now: baseNow,
    })
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it("requires suspendAt for scheduled mode", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "scheduled",
      now: baseNow,
    })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/suspend date and time is required/i)
  })

  it("rejects suspend date in the past", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "scheduled",
      suspendAt: "2026-11-23T11:00:00Z",
      now: baseNow,
    })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/must be in the future/i)
  })

  it("rejects notifyFrom after notifyTo", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "scheduled",
      suspendAt: "2026-11-25T12:00:00Z",
      notifyFrom: "2026-11-24T15:00:00Z",
      notifyTo: "2026-11-24T12:00:00Z",
      now: baseNow,
    })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/start date cannot be after end date/i)
  })

  it("rejects notifyTo after suspendAt", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "scheduled",
      suspendAt: "2026-11-25T12:00:00Z",
      notifyTo: "2026-11-25T15:00:00Z",
      now: baseNow,
    })
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/end date cannot be after suspension date/i)
  })

  it("accepts valid scheduled suspension input", () => {
    const res = validateSuspendInput({
      confirmed: true,
      mode: "scheduled",
      notifyFrom: "2026-11-24T00:00:00Z",
      notifyTo: "2026-11-25T00:00:00Z",
      suspendAt: "2026-11-25T12:00:00Z",
      now: baseNow,
    })
    expect(res.valid).toBe(true)
    expect(res.error).toBeUndefined()
  })
})
