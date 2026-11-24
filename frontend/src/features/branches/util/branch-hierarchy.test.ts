import { describe, expect, it } from "vitest"

import { getDescendantBranchIds } from "@/features/branches/util/branch-hierarchy"

describe("getDescendantBranchIds", () => {
  it("returns all direct and indirect children of a branch", () => {
    const branches = [
      { id: "hq", parentId: null },
      { id: "child-1", parentId: "hq" },
      { id: "child-2", parentId: "hq" },
      { id: "grandchild-1", parentId: "child-1" },
      { id: "unrelated", parentId: null },
    ]

    const hqDescendants = getDescendantBranchIds("hq", branches)
    expect(hqDescendants).toEqual(new Set(["child-1", "child-2", "grandchild-1"]))

    const child1Descendants = getDescendantBranchIds("child-1", branches)
    expect(child1Descendants).toEqual(new Set(["grandchild-1"]))

    const leafDescendants = getDescendantBranchIds("grandchild-1", branches)
    expect(leafDescendants.size).toBe(0)
  })

  it("handles circular references gracefully without infinite loop", () => {
    const branches = [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ]

    const descendants = getDescendantBranchIds("a", branches)
    expect(descendants.has("b")).toBe(true)
  })
})
