import {
  BriefcaseIcon,
  GitBranchIcon,
  NetworkIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react"

import type { PortalNavItem } from "@/portals/types"

export const ORGANIZATION_NAV: PortalNavItem[] = [
  {
    to: "/",
    end: true,
    labelKey: "nav.branches",
    groupKey: "nav_groups.structure",
    icon: GitBranchIcon,
    matchPrefix: "/branches",
    permission: "org.branch.read",
  },
  {
    to: "/departments",
    labelKey: "nav.departments",
    groupKey: "nav_groups.structure",
    icon: NetworkIcon,
    matchPrefix: "/departments",
    permission: "org.department.read",
  },
  {
    to: "/positions",
    labelKey: "nav.positions",
    groupKey: "nav_groups.structure",
    icon: BriefcaseIcon,
    matchPrefix: "/positions",
    permission: "org.position.read",
  },
  {
    to: "/roles",
    labelKey: "nav.roles",
    groupKey: "nav_groups.people",
    icon: ShieldIcon,
    matchPrefix: "/roles",
    permission: "org.role.read",
  },
  {
    to: "/account",
    labelKey: "nav.account",
    groupKey: "nav_groups.account",
    icon: UserRoundIcon,
    matchPrefix: "/account",
  },
]
