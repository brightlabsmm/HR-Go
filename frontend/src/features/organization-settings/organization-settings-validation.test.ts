import { describe, expect, it } from "vitest"
import { z } from "zod"

const CODE_FORMAT_REGEX = /\{([0N#]+)\}/

const createCodeFormatSchema = (
  errorMessage = "Format must contain a sequence placeholder like {0000}."
) =>
  z.object({
    branchCodeFormat: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || CODE_FORMAT_REGEX.test(val), errorMessage),
    departmentCodeFormat: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || CODE_FORMAT_REGEX.test(val), errorMessage),
  })

describe("code format validation (BUG-20)", () => {
  it("rejects code format without placeholder", () => {
    const schema = createCodeFormatSchema()
    const result = schema.safeParse({
      branchCodeFormat: "XYZ",
      departmentCodeFormat: "DEPT",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2)
      expect(result.error.issues[0]?.message).toBe(
        "Format must contain a sequence placeholder like {0000}."
      )
    }
  })

  it("accepts valid code formats with placeholders", () => {
    const schema = createCodeFormatSchema()
    const result = schema.safeParse({
      branchCodeFormat: "BR-{0000}",
      departmentCodeFormat: "DEPT-{NNN}",
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty or omitted code formats (falling back to defaults)", () => {
    const schema = createCodeFormatSchema()
    const result = schema.safeParse({
      branchCodeFormat: "",
      departmentCodeFormat: undefined,
    })
    expect(result.success).toBe(true)
  })
})
