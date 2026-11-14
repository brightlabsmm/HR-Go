import { describe, expect, it } from "vitest"

import { compactParams } from "@/util/compact-params"

describe("compactParams", () => {
  it("drops empty values", () => {
    expect(
      compactParams({
        page: 1,
        search: "",
        status: undefined,
        active: false,
      })
    ).toEqual({ page: 1, active: false })
  })

  it("returns undefined when nothing remains", () => {
    expect(compactParams({ search: "" })).toBeUndefined()
  })
})
