import { describe, expect, it } from "vitest"

import { STATUS_ACTION_CONFIG } from "./organization-status-buttons"

describe("organization-status-buttons", () => {
  it("defines configuration for all status actions", () => {
    expect(STATUS_ACTION_CONFIG.activate).toBeDefined()
    expect(STATUS_ACTION_CONFIG.suspend).toBeDefined()
    expect(STATUS_ACTION_CONFIG.reactivate).toBeDefined()
  })

  it("assigns appropriate color tones for each action", () => {
    expect(STATUS_ACTION_CONFIG.activate.tone).toBe("success")
    expect(STATUS_ACTION_CONFIG.suspend.tone).toBe("warning")
    expect(STATUS_ACTION_CONFIG.reactivate.tone).toBe("success")
  })
})
