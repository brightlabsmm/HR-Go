import { describe, expect, it } from "vitest"

import { toListQuery } from "@/util/list-query"

describe("toListQuery", () => {
  it("maps page, limit, search and status", () => {
    expect(
      toListQuery({
        page: 2,
        limit: 10,
        search: "yangon",
        status: "active",
      })
    ).toEqual({
      page: 2,
      pageSize: 10,
      q: "yangon",
      status: "ACTIVE",
    })
  })

  it("passes server sort and filter arrays", () => {
    expect(
      toListQuery({
        sortBy: ["code", "status"],
        sortOrder: ["asc", "desc"],
        filter: ["status:eq:ACTIVE"],
      })
    ).toEqual({
      sortBy: ["code", "status"],
      sortOrder: ["asc", "desc"],
      filter: ["status:eq:ACTIVE"],
    })
  })
})
