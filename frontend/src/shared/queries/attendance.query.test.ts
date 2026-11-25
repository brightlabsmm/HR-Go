import { describe, expect, it } from "vitest"

import { attendanceKeys } from "./attendance.query"

describe("attendanceKeys (Phase 2 query key structure)", () => {
  it("keeps correctionDetail separate from correction list prefix", () => {
    const listPrefix = [...attendanceKeys.corrections(), "list"]
    const listKey = attendanceKeys.correctionList({ page: 1 })
    const detailKey = attendanceKeys.correctionDetail("corr-123")

    expect(listKey.slice(0, listPrefix.length)).toEqual(listPrefix)
    expect(detailKey.slice(0, listPrefix.length)).not.toEqual(listPrefix)
  })
})
