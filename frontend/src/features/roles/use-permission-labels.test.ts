import { describe, expect, it } from "vitest"

import { splitPermission } from "./use-permission-labels"

describe("splitPermission & permission naming (BUG-16)", () => {
  it("splits simple two-part and three-part permission codes", () => {
    expect(splitPermission("platform.permission.read")).toEqual({
      resource: "platform.permission",
      action: "read",
    })
    expect(splitPermission("platform.role.read")).toEqual({
      resource: "platform.role",
      action: "read",
    })
    expect(splitPermission("org.role.read")).toEqual({
      resource: "org.role",
      action: "read",
    })
    expect(splitPermission("platform.role.assign")).toEqual({
      resource: "platform.role",
      action: "assign",
    })
    expect(splitPermission("org.role.assign")).toEqual({
      resource: "org.role",
      action: "assign",
    })
  })

  it("splits compound action permissions properly", () => {
    expect(splitPermission("platform.organization.status.update")).toEqual({
      resource: "platform.organization",
      action: "status_update",
    })
  })
})
