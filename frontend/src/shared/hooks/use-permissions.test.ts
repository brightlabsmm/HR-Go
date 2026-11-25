import { describe, expect, it } from "vitest"

import { hasPermission } from "./use-permissions"

describe("hasPermission (Phase 2 RBAC wildcard)", () => {
  it("matches exact permission code", () => {
    expect(hasPermission(["org.employee.read"], "org.employee.read")).toBe(true)
    expect(hasPermission(["org.employee.read"], "org.employee.delete")).toBe(false)
  })

  it("grants access when org.all or platform.all wildcard is present", () => {
    expect(hasPermission(["org.all"], "org.employee.delete")).toBe(true)
    expect(hasPermission(["platform.all"], "org.shift.assign")).toBe(true)
    expect(hasPermission([], "org.shift.assign")).toBe(false)
  })
})
