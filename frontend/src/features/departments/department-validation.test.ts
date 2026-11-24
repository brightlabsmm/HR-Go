import { describe, expect, it } from "vitest"
import { z } from "zod"

const createDepartmentSchema = (
  nameError = "Department name is required.",
  maxError = "Department name cannot exceed 150 characters."
) =>
  z.object({
    departmentName: z.string().trim().min(1, nameError).max(150, maxError),
    branchId: z.string(),
  })

describe("department schema validation (BUG-19)", () => {
  it("rejects empty department name", () => {
    const schema = createDepartmentSchema()
    const result = schema.safeParse({ departmentName: "   ", branchId: "none" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Department name is required.")
    }
  })

  it("rejects department name exceeding 150 characters", () => {
    const schema = createDepartmentSchema()
    const longName = "A".repeat(151)
    const result = schema.safeParse({ departmentName: longName, branchId: "none" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Department name cannot exceed 150 characters."
      )
    }
  })

  it("accepts valid department name up to 150 characters", () => {
    const schema = createDepartmentSchema()
    const validName = "A".repeat(150)
    const result = schema.safeParse({ departmentName: validName, branchId: "none" })
    expect(result.success).toBe(true)
  })
})
