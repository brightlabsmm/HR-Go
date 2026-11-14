import { describe, expect, it } from "vitest"

import {
  isOptionalE164Phone,
  isValidBranchPhone,
  splitPhone,
  toE164Phone,
  uniqueDialCodes,
} from "@/util/phone"

describe("phone helpers", () => {
  it("accepts blank and E.164 numbers", () => {
    expect(isValidBranchPhone("")).toBe(true)
    expect(isValidBranchPhone("+95912345678")).toBe(true)
    expect(isValidBranchPhone("912345678")).toBe(true)
    expect(isValidBranchPhone("123")).toBe(false)
    expect(isOptionalE164Phone("")).toBe(true)
    expect(isOptionalE164Phone("+95912345678")).toBe(true)
    expect(isOptionalE164Phone("912345678")).toBe(false)
  })

  it("normalizes local digits with a country code", () => {
    expect(toE164Phone("912345678", "+95")).toBe("+95912345678")
    expect(toE164Phone("0912345678", "+95")).toBe("+95912345678")
    expect(toE164Phone("+95912345678", "+95")).toBe("+95912345678")
    expect(toE164Phone("0", "+95")).toBeUndefined()
    expect(toE164Phone("", "+95")).toBeUndefined()
  })

  it("splits an E.164 number by the longest matching dial code", () => {
    expect(
      splitPhone("+95912345678", ["+95", "+66"], "+66")
    ).toEqual({
      phoneCode: "+95",
      national: "912345678",
    })
    expect(splitPhone("", ["+95", "+66"], "+66")).toEqual({
      phoneCode: "+66",
      national: "",
    })
  })

  it("dedupes dial codes from the country list", () => {
    expect(
      uniqueDialCodes([
        { phone_code: "+95", iso_code: "mm", name: "Myanmar" },
        { phone_code: "95", iso_code: "MM", name: "Myanmar Duplicate" },
        { phone_code: "+66", iso_code: "TH", name: "Thailand" },
      ])
    ).toEqual([
      { phoneCode: "+66", isoCode: "TH", name: "Thailand" },
      { phoneCode: "+95", isoCode: "MM", name: "Myanmar" },
    ])
  })
})
