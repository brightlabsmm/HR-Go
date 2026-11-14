import { APP_CONFIG } from "@/app/config/app.config"

export function controlPath(path: string) {
  return `/control${path}`
}

export function workspacePath(path: string) {
  return `/workspace${path}`
}

export function portalAuthPath(path: string) {
  return APP_CONFIG.portal === "platform"
    ? controlPath(`/auth${path}`)
    : workspacePath(`/auth${path}`)
}
