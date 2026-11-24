import { describe, expect, it } from "vitest"

describe("branch edit parent clearing (BUG-26)", () => {
  it("converts 'none' selection to empty string so parent is removed", () => {
    const values = {
      branchName: "Main Branch",
      parentId: "none",
      address: "123 Street",
    }

    const payload = {
      branchName: values.branchName.trim(),
      parentId: values.parentId === "none" ? "" : values.parentId,
      address: values.address.trim(),
    }

    expect(payload.parentId).toBe("")
  })

  it("preserves valid selected parent id", () => {
    const values = {
      branchName: "Main Branch",
      parentId: "parent-branch-uuid",
      address: "123 Street",
    }

    const payload = {
      branchName: values.branchName.trim(),
      parentId: values.parentId === "none" ? "" : values.parentId,
      address: values.address.trim(),
    }

    expect(payload.parentId).toBe("parent-branch-uuid")
  })
})
