import { describe, expect, it } from "vitest"

import {
  parseColumnFilter,
  serializeColumnFilter,
  upsertColumnFilter,
} from "@/util/column-filter"

describe("column-filter", () => {
  it("serializes and parses field:op:value", () => {
    expect(
      serializeColumnFilter({ field: "name", op: "ilike", value: "eng" })
    ).toBe("name:ilike:eng")
    expect(parseColumnFilter("status:eq:ACTIVE")).toEqual({
      field: "status",
      op: "eq",
      value: "ACTIVE",
    })
  })

  it("serializes valueless ops", () => {
    expect(
      serializeColumnFilter({ field: "address", op: "isnull", value: "" })
    ).toBe("address:isnull")
    expect(parseColumnFilter("address:notnull")).toEqual({
      field: "address",
      op: "notnull",
      value: "",
    })
  })

  it("upserts by field case-insensitively", () => {
    const next = upsertColumnFilter(
      [{ field: "name", op: "ilike", value: "a" }],
      { field: "Name", op: "eq", value: "b" },
      "name"
    )
    expect(next).toEqual([{ field: "Name", op: "eq", value: "b" }])
  })
})
