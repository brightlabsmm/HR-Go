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

  it("highlights Branches on nested branch detail routes", () => {
    const active = findActiveNavItemForList(
      ORGANIZATION_NAV,
      "/branches/branch-123"
    )
    expect(active?.to).toBe("/")
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
