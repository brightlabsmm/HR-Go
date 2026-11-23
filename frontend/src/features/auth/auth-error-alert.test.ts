import { describe, expect, it } from "vitest"

import { API_ERROR_CODES } from "@/app/api/codes"
import { ApiError } from "@/app/api/types"
import { getAuthErrorAlert } from "@/features/auth/auth-error-alert"

const t = ((key: string) => key) as never

describe("getAuthErrorAlert", () => {
  it("maps a forbidden account to the inline alert copy", () => {
    expect(
      getAuthErrorAlert(
        new ApiError({
          status: 403,
          code: API_ERROR_CODES.FORBIDDEN,
          message: "Your account is inactive.",
        }),
        t
      )
    ).toEqual({
      title: "login.error_suspended_title",
      description: "login.error_contact_admin",
    })
  })

  it("maps field validation errors to the inline alert", () => {
    expect(
      getAuthErrorAlert(
        new ApiError({
          status: 400,
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: "The request contains invalid data.",
          details: [{ field: "password", message: "Password is required." }],
        }),
        t
      )
    ).toEqual({ title: "Password is required." })
  })

  it("uses generic copy when the error has no message", () => {
    expect(getAuthErrorAlert(new Error("boom"), t)).toEqual({
      title: "login.error_generic",
    })
  })

  it("maps 401 unauthorized to the translated invalid credentials copy", () => {
    expect(
      getAuthErrorAlert(
        new ApiError({
          status: 401,
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: "Invalid employee identifier or password.",
        }),
        t
      )
    ).toEqual({ title: "login.error_invalid_credentials" })
  })
})
