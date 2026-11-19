import { APP_CONFIG } from "@/app/config/app.config"

export function isPlatformPortal() {
  return APP_CONFIG.portal === "platform"
}
