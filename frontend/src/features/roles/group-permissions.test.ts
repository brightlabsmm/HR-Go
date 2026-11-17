import { describe, expect, it } from "vitest"

import {
  groupPermissions,
  groupPermissionsByGrouping,
  resolvePermissionGrouping,
} from "./group-permissions"

import type { Role } from "@/shared/services/role.service"

describe("group-permissions", () => {
  it("resolves grouping from permission.grouping when provided", () => {
    expect(
      resolvePermissionGrouping({
        code: "platform.user.read",
        grouping: "user",
      })
    ).toBe("user")
  })

  it("infers grouping from permission code when grouping is missing", () => {
    expect(resolvePermissionGrouping({ code: "platform.user.read" })).toBe("user")
    expect(resolvePermissionGrouping({ code: "platform.role.read" })).toBe("role")
    expect(
      resolvePermissionGrouping({ code: "platform.organization.create" })
    ).toBe("organization")
    expect(resolvePermissionGrouping({ code: "org.branch.create" })).toBe("branch")
    expect(resolvePermissionGrouping({ code: "org.department.update" })).toBe("department")
    expect(resolvePermissionGrouping({ code: "org.position.create" })).toBe("position")
  })

  it("groups permissions by grouping correctly", () => {
    const role: Role = {
      id: "r1",
      roleCode: "TEST_ROLE",
      roleName: "Test Role",
      permissions: [
        {
          id: "p1",
          code: "org.branch.create",
          grouping: "branch",
          resource: "branch",
          action: "create",
        },
        {
          id: "p2",
          code: "org.branch.update",
          grouping: "branch",
          resource: "branch",
          action: "update",
        },
        {
          id: "p3",
          code: "org.branch.delete",
          grouping: "branch",
          resource: "branch",
          action: "delete",
        },
        {
          id: "p4",
          code: "platform.user.read",
          grouping: "user",
          resource: "platform_user",
          action: "read",
        },
      ],
    }

    const flatGroups = groupPermissions([role])
    expect(flatGroups.length).toBe(2)
    expect(flatGroups[0].grouping).toBe("branch")
    expect(flatGroups[1].grouping).toBe("user")

    const grouped = groupPermissionsByGrouping(role.permissions)
    expect(grouped.length).toBe(2)
    expect(grouped[0].grouping).toBe("branch")
    expect(grouped[0].permissions.length).toBe(3)
    expect(grouped[1].grouping).toBe("user")
    expect(grouped[1].permissions.length).toBe(1)
  })
})
