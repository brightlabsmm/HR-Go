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
    permissions: [
      "platform.organization.read",
      "platform.organization.create",
      "platform.organization.update",
      "platform.organization.status.update",
      "platform.organization.delete",
    ],
  },
  {
    to: "/users",
    labelKey: "nav.users",
    groupKey: "nav_groups.access",
    icon: UsersIcon,
    matchPrefix: "/users",
    permissions: [
      "platform.user.read",
      "platform.user.create",
      "platform.user.update",
      "platform.user.deactivate",
    ],
  },
  {
    to: "/roles",
    labelKey: "nav.roles",
    groupKey: "nav_groups.access",
    icon: ShieldIcon,
    matchPrefix: "/roles",
    permissions: ["platform.role.read", "platform.role.assign"],
  },
  {
    to: "/permissions",
    labelKey: "nav.permissions",
    groupKey: "nav_groups.access",
    icon: KeyRoundIcon,
    matchPrefix: "/permissions",
    permissions: ["platform.permission.read"],
  },
  {
    to: "/account",
    labelKey: "nav.account",
    groupKey: "nav_groups.account",
    icon: UserRoundIcon,
    matchPrefix: "/account",
  },
]
