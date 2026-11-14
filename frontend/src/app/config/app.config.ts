export const APP_PORTALS = ["organization", "platform"] as const

export type AppPortal = (typeof APP_PORTALS)[number]

function resolvePortal(value: string | undefined): AppPortal {
  return value === "platform" ? "platform" : "organization"
}

const portal = resolvePortal(import.meta.env.VITE_PORTAL)

export const APP_CONFIG = {
  name: portal === "platform" ? "HR Go Platform" : "HR Go",
  portal,
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  defaultQueryStaleTimeMs: 60_000,
} as const
