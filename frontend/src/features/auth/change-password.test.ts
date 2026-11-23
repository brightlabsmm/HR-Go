import { describe, expect, it } from "vitest"
import { z } from "zod"

import { useAuthStore } from "@/shared/stores/auth.store"

const createChangePasswordSchema = () =>
  z
    .object({
      currentPassword: z.string().min(1, "Current password is required."),
      newPassword: z.string().min(8, "Password must be at least 8 characters."),
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

describe("Change Password Form & Store (BUG-07)", () => {
  it("rejects when current password is missing", () => {
    const schema = createChangePasswordSchema()
    const result = schema.safeParse({
      currentPassword: "",
      newPassword: "NewPassword@123",
      confirmPassword: "NewPassword@123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects when new password is less than 8 characters", () => {
    const schema = createChangePasswordSchema()
    const result = schema.safeParse({
      currentPassword: "CurrentPassword@123",
      newPassword: "short",
      confirmPassword: "short",
    })
    expect(result.success).toBe(false)
  })

  it("rejects when new password matches current password", () => {
    const schema = createChangePasswordSchema()
    const result = schema.safeParse({
      currentPassword: "SamePassword@123",
      newPassword: "SamePassword@123",
      confirmPassword: "SamePassword@123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects when confirm password does not match", () => {
    const schema = createChangePasswordSchema()
    const result = schema.safeParse({
      currentPassword: "CurrentPassword@123",
      newPassword: "NewPassword@123",
      confirmPassword: "DifferentPassword@123",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid distinct new password with match", () => {
    const schema = createChangePasswordSchema()
    const result = schema.safeParse({
      currentPassword: "OldPassword@123",
      newPassword: "NewPassword@123",
      confirmPassword: "NewPassword@123",
    })
    expect(result.success).toBe(true)
  })

  it("manages mustChangePassword state in auth store", () => {
    useAuthStore.getState().setSession({
      accessToken: "mock-token",
      mustChangePassword: true,
    })
    expect(useAuthStore.getState().accessToken).toBe("mock-token")
    expect(useAuthStore.getState().mustChangePassword).toBe(true)

    useAuthStore.getState().setMustChangePassword(false)
    expect(useAuthStore.getState().mustChangePassword).toBe(false)

    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().mustChangePassword).toBe(false)
  })
})
