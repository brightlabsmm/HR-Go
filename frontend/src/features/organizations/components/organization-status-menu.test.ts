import { describe, expect, it } from "vitest"

import {
  getAvailableStatusTransitions,
  isHighImpactOrganizationStatus,
  toOrganizationStatus,
} from "./organization-status-menu"

describe("organization-status-menu", () => {
  it("normalizes organization status strings correctly", () => {
    expect(toOrganizationStatus("pending")).toBe("PENDING")
    expect(toOrganizationStatus("ACTIVE")).toBe("ACTIVE")
    expect(toOrganizationStatus("Suspended")).toBe("SUSPENDED")
    expect(toOrganizationStatus("archived")).toBeNull()
    expect(toOrganizationStatus("INVALID")).toBeNull()
  })

  it("identifies high impact statuses correctly", () => {
    expect(isHighImpactOrganizationStatus("SUSPENDED")).toBe(true)
    expect(isHighImpactOrganizationStatus("ACTIVE")).toBe(false)
    expect(isHighImpactOrganizationStatus("PENDING")).toBe(false)
  })

  it("returns only allowed transitions for PENDING (Activate -> ACTIVE)", () => {
    const transitions = getAvailableStatusTransitions("PENDING")
    expect(transitions).toEqual([{ status: "ACTIVE", action: "activate" }])
  })

  it("returns only allowed transitions for ACTIVE (Suspend -> SUSPENDED)", () => {
    const transitions = getAvailableStatusTransitions("ACTIVE")
    expect(transitions).toEqual([{ status: "SUSPENDED", action: "suspend" }])
  })

  it("returns only allowed transitions for SUSPENDED (Reactivate -> ACTIVE)", () => {
    const transitions = getAvailableStatusTransitions("SUSPENDED")
    expect(transitions).toEqual([{ status: "ACTIVE", action: "reactivate" }])
  })

  it("returns empty array for ARCHIVED status", () => {
    expect(getAvailableStatusTransitions("ARCHIVED")).toEqual([])
  })

  it("returns empty array for invalid or unknown status", () => {
    expect(getAvailableStatusTransitions("UNKNOWN")).toEqual([])
    expect(getAvailableStatusTransitions("")).toEqual([])
  })
})
