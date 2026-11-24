import { describe, expect, it } from "vitest"

import { isDeletableOrganization } from "./util/organization-rules"

describe("isDeletableOrganization (BUG-31)", () => {
  it("allows delete for never-activated PENDING organizations when user has permission", () => {
    expect(isDeletableOrganization({ status: "PENDING" }, true)).toBe(true)
  })

  it("blocks delete for ACTIVE organizations even with permission", () => {
    expect(isDeletableOrganization({ status: "ACTIVE" }, true)).toBe(false)
  })

  it("blocks delete for SUSPENDED organizations even with permission", () => {
    expect(isDeletableOrganization({ status: "SUSPENDED" }, true)).toBe(false)
  })

  it("blocks delete if user lacks delete permission", () => {
    expect(isDeletableOrganization({ status: "PENDING" }, false)).toBe(false)
    expect(isDeletableOrganization({ status: "ACTIVE" }, false)).toBe(false)
  })

  it("blocks delete when organization is null or undefined", () => {
    expect(isDeletableOrganization(null, true)).toBe(false)
    expect(isDeletableOrganization(undefined, true)).toBe(false)
  })
})
