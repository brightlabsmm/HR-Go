import { describe, expect, it } from "vitest"
import { z } from "zod"

import { PASSWORD_PATTERN } from "@/constants/timezones"
import { isCommonPassword } from "@/util/password"

const createAccountPasswordSchema = () =>
  z
    .object({
      currentPassword: z.string().min(1, "Current password is required."),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(
          PASSWORD_PATTERN,
          "Password must include 1 uppercase letter, 1 lowercase letter, and 1 digit."
        )
        .refine((val) => !isCommonPassword(val), {
          message: "This password is too common or weak.",
        }),
      confirmPassword: z.string().min(1, "Please confirm your new password."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password.",
      path: ["newPassword"],
    })

describe("AccountPasswordForm schema validation (BUG-28)", () => {
  const schema = createAccountPasswordSchema()

  it("rejects empty current password", () => {
    const res = schema.safeParse({
      currentPassword: "",
      newPassword: "NewValidPassword@123",
      confirmPassword: "NewValidPassword@123",
    })
    expect(res.success).toBe(false)
  })

  it("rejects weak or common new password", () => {
    const res = schema.safeParse({
      currentPassword: "CurrentPassword@123",
      newPassword: "password",
      confirmPassword: "password",
    })
    expect(res.success).toBe(false)
  })

  it("rejects when new password matches current password", () => {
    const res = schema.safeParse({
      currentPassword: "SamePassword@123",
      newPassword: "SamePassword@123",
      confirmPassword: "SamePassword@123",
    })
    expect(res.success).toBe(false)
  })

  it("rejects when confirm password does not match", () => {
    const res = schema.safeParse({
      currentPassword: "CurrentPassword@123",
      newPassword: "NewValidPassword@123",
      confirmPassword: "MismatchPassword@123",
    })
    expect(res.success).toBe(false)
  })

  it("accepts valid password update", () => {
    const res = schema.safeParse({
      currentPassword: "CurrentPassword@123",
      newPassword: "NewValidPassword@123",
      confirmPassword: "NewValidPassword@123",
    })
    expect(res.success).toBe(true)
  })
})
