import { describe, expect, it } from "vitest"

import { findActiveNavItemForList } from "@/portals/nav"
import { ORGANIZATION_NAV } from "@/portals/organization/nav"
import { PLATFORM_NAV } from "@/portals/platform/nav"

describe("sidebar nav active matching", () => {
  it("highlights only Import & Export on /attendance/imports", () => {
    const active = findActiveNavItemForList(
      ORGANIZATION_NAV,
      "/attendance/imports"
    )
    expect(active?.to).toBe("/attendance/imports")
  })

  it("highlights Attendance on /attendance", () => {
    const active = findActiveNavItemForList(ORGANIZATION_NAV, "/attendance")
    expect(active?.to).toBe("/attendance")
  })

  it("highlights Dashboard on / and Branches on /branches and nested branch detail routes", () => {
    const homeActive = findActiveNavItemForList(ORGANIZATION_NAV, "/")
    expect(homeActive?.to).toBe("/")
    expect(homeActive?.labelKey).toBe("nav.dashboard")

    const branchListActive = findActiveNavItemForList(
      ORGANIZATION_NAV,
      "/branches"
    )
    expect(branchListActive?.to).toBe("/branches")
    expect(branchListActive?.labelKey).toBe("nav.branches")

    const active = findActiveNavItemForList(
      ORGANIZATION_NAV,
      "/branches/branch-123"
    )
    expect(active?.to).toBe("/branches")
    expect(active?.labelKey).toBe("nav.branches")
  })

  it("highlights Organizations on / and /organizations/:id in platform nav", () => {
    expect(findActiveNavItemForList(PLATFORM_NAV, "/")?.to).toBe("/")
    expect(
      findActiveNavItemForList(PLATFORM_NAV, "/organizations/org-1")?.to
    ).toBe("/")
    expect(findActiveNavItemForList(PLATFORM_NAV, "/users")?.to).toBe("/users")
  })
})
