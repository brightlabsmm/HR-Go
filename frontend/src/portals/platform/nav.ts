import { Building2Icon, KeyRoundIcon, ShieldIcon, UserRoundIcon, UsersIcon } from "lucide-react"

import type { PortalNavItem } from "@/portals/types"

export const PLATFORM_NAV: PortalNavItem[] = [
  {
    to: "/",
    end: true,
    labelKey: "nav.organizations",
    groupKey: "nav_groups.tenants",
    icon: Building2Icon,
    matchPrefix: "/organizations",
    permission: "platform.organization.read",
  },
  {
    to: "/users",
    labelKey: "nav.users",
    groupKey: "nav_groups.access",
    icon: UsersIcon,
    matchPrefix: "/users",
    permission: "platform.user.read",
  },
  {
    to: "/roles",
    labelKey: "nav.roles",
    groupKey: "nav_groups.access",
    icon: ShieldIcon,
    matchPrefix: "/roles",
    permission: "platform.role.read",
  },
  {
    to: "/permissions",
    labelKey: "nav.permissions",
    groupKey: "nav_groups.access",
    icon: KeyRoundIcon,
    matchPrefix: "/permissions",
    permission: "platform.permission.read",
  },
  {
    to: "/account",
    labelKey: "nav.account",
    groupKey: "nav_groups.account",
    icon: UserRoundIcon,
    matchPrefix: "/account",
  },
]
