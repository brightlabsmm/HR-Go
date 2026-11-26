import { APP_CONFIG } from "@/app/config/app.config"
import { ORGANIZATION_NAV } from "@/portals/organization/nav"
import { PLATFORM_NAV } from "@/portals/platform/nav"

import type { PortalNavItem } from "@/portals/types"

export const PORTAL_NAV =
  APP_CONFIG.portal === "platform" ? PLATFORM_NAV : ORGANIZATION_NAV

function matchesPrefix(prefix: string, pathname: string) {
  if (prefix === "/") {
    return pathname === "/"
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function itemMatchSpecificity(item: PortalNavItem, pathname: string): number {
  let best = -1
  if (item.matchPrefix && matchesPrefix(item.matchPrefix, pathname)) {
    best = Math.max(best, item.matchPrefix.length)
  }
  const matchesTo = item.end
    ? pathname === item.to
    : matchesPrefix(item.to, pathname)
  if (matchesTo) {
    best = Math.max(best, item.to.length)
  }
  return best
}

export function findActiveNavItemForList(
  items: PortalNavItem[],
  pathname: string
) {
  let bestItem: PortalNavItem | undefined
  let bestScore = -1

  for (const item of items) {
    const score = itemMatchSpecificity(item, pathname)
    if (score > bestScore) {
      bestScore = score
      bestItem = item
    }
  }

  return bestItem
}

export function findActiveNavItem(pathname: string) {
  return findActiveNavItemForList(PORTAL_NAV, pathname)
}

export function isNavItemActive(item: PortalNavItem, pathname: string) {
  return findActiveNavItem(pathname)?.to === item.to
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
