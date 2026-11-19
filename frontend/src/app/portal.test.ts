import { describe, expect, it } from "vitest"

import { APP_CONFIG } from "@/app/config/app.config"
import { isPlatformPortal } from "@/app/portal"

describe("isPlatformPortal", () => {
  it("matches the configured portal", () => {
    expect(isPlatformPortal()).toBe(APP_CONFIG.portal === "platform")
  })
})
