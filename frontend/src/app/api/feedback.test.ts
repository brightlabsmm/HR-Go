import { describe, expect, it, vi } from "vitest"
import { ApiError } from "@/app/api/types"
import { applyApiFieldErrors } from "@/app/api/feedback"

describe("applyApiFieldErrors", () => {
  it("applies field errors to react-hook-form setError", () => {
    const setError = vi.fn()
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "The request contains invalid data.",
      details: [
        { field: "contactPhone", message: "Please enter a valid phone number." },
        { field: "country", message: "Country is required." },
      ],
    })

    const applied = applyApiFieldErrors(error, setError)
    expect(applied).toBe(true)
    expect(setError).toHaveBeenCalledTimes(2)
    expect(setError).toHaveBeenCalledWith("contactPhone", {
      message: "Please enter a valid phone number.",
    })
    expect(setError).toHaveBeenCalledWith("country", {
      message: "Country is required.",
    })
  })

  it("applies display name max length validation error (BUG-33)", () => {
    const setError = vi.fn()
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "The request contains invalid data.",
      details: [
        { field: "displayName", message: "Display name must not exceed 255 characters." },
      ],
    })

    const applied = applyApiFieldErrors(error, setError)
    expect(applied).toBe(true)
    expect(setError).toHaveBeenCalledTimes(1)
    expect(setError).toHaveBeenCalledWith("displayName", {
      message: "Display name must not exceed 255 characters.",
    })
  })

  it("maps generic container field names to root", () => {
    const setError = vi.fn()
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid payload",
      details: [{ field: "organization", message: "Missing required fields." }],
    })

    const applied = applyApiFieldErrors(error, setError)
    expect(applied).toBe(true)
    expect(setError).toHaveBeenCalledWith("root", {
      message: "Missing required fields.",
    })
  })

  it("returns false when error is not an ApiError", () => {
    const setError = vi.fn()
    const applied = applyApiFieldErrors(new Error("network error"), setError)
    expect(applied).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})
