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

describe("organization settings field validation (BUG-29)", () => {
  const schema = z.object({
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required.")
      .max(255, "Display name must not exceed 255 characters."),
    contactEmail: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .max(255, "Email must not exceed 255 characters.")
      .email("Please enter a valid email address."),
    address: z
      .string()
      .trim()
      .min(1, "Address is required.")
      .max(2000, "Address must not exceed 2000 characters."),
  })

  it("rejects 300-character display name with max length error", () => {
    const longName = "A".repeat(300)
    const result = schema.safeParse({
      displayName: longName,
      contactEmail: "test@example.com",
      address: "123 Street",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("displayName"))
      expect(issue).toBeDefined()
      expect(issue?.message).toBe("Display name must not exceed 255 characters.")
    }
  })

  it("rejects invalid email format", () => {
    const result = schema.safeParse({
      displayName: "Valid Name",
      contactEmail: "invalid-email-address",
      address: "123 Street",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("contactEmail"))
      expect(issue).toBeDefined()
      expect(issue?.message).toBe("Please enter a valid email address.")
    }
  })

  it("accepts valid input within character limits", () => {
    const result = schema.safeParse({
      displayName: "Proper Organization Name",
      contactEmail: "admin@company.com",
      address: "456 Main Avenue, Suite 100",
    })
    expect(result.success).toBe(true)
  })
})
