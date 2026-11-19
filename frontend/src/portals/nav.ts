import { APP_CONFIG } from "@/app/config/app.config"
import { ORGANIZATION_NAV } from "@/portals/organization/nav"
import { PLATFORM_NAV } from "@/portals/platform/nav"

import type { PortalNavItem } from "@/portals/types"

export const PORTAL_NAV =
  APP_CONFIG.portal === "platform" ? PLATFORM_NAV : ORGANIZATION_NAV

export function isNavItemActive(item: PortalNavItem, pathname: string) {
  if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) {
    return true
  }

  return item.end ? pathname === item.to : pathname.startsWith(item.to)
}

export function findActiveNavItem(pathname: string) {
  return PORTAL_NAV.find((item) => isNavItemActive(item, pathname))
}

export function canAccessNavItem(
  item: PortalNavItem,
  can: (code: string) => boolean,
  hasUser: boolean
) {
  const required = item.permissions ?? []
  if (required.length === 0) {
    return true
  }

  if (!hasUser) {
    return false
  }

  return required.every((code) => can(code))
}

export function visiblePortalNav(
  can: (code: string) => boolean,
  hasUser: boolean
) {
  return PORTAL_NAV.filter((item) => canAccessNavItem(item, can, hasUser))
}
