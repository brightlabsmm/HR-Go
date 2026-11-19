import { describe, expect, it } from "vitest"

import { STATUS_ACTION_CONFIG } from "./organization-status-buttons"

describe("organization-status-buttons", () => {
  it("defines configuration for all status actions", () => {
    expect(STATUS_ACTION_CONFIG.activate).toBeDefined()
    expect(STATUS_ACTION_CONFIG.suspend).toBeDefined()
    expect(STATUS_ACTION_CONFIG.reactivate).toBeDefined()
  })

  it("assigns appropriate color classes for each action", () => {
    // activate -> success/green
    expect(STATUS_ACTION_CONFIG.activate.className).toContain("text-success")
    expect(STATUS_ACTION_CONFIG.activate.className).toContain("border-success")

    // suspend -> warning/amber
    expect(STATUS_ACTION_CONFIG.suspend.className).toContain("text-warning")
    expect(STATUS_ACTION_CONFIG.suspend.className).toContain("border-warning")

    // reactivate -> success/green
    expect(STATUS_ACTION_CONFIG.reactivate.className).toContain("text-success")
    expect(STATUS_ACTION_CONFIG.reactivate.className).toContain("border-success")
  })
})
