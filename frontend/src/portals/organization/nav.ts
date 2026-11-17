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
    permissions: [
      "org.branch.read",
      "org.branch.create",
      "org.branch.update",
      "org.branch.deactivate",
    ],
  },
  {
    to: "/departments",
    labelKey: "nav.departments",
    groupKey: "nav_groups.structure",
    icon: NetworkIcon,
    matchPrefix: "/departments",
    permissions: [
      "org.department.read",
      "org.department.create",
      "org.department.update",
      "org.department.deactivate",
    ],
  },
  {
    to: "/positions",
    labelKey: "nav.positions",
    groupKey: "nav_groups.structure",
    icon: BriefcaseIcon,
    matchPrefix: "/positions",
    permissions: [
      "org.position.read",
      "org.position.create",
      "org.position.update",
      "org.position.deactivate",
    ],
  },
  {
    to: "/roles",
    labelKey: "nav.roles",
    groupKey: "nav_groups.people",
    icon: ShieldIcon,
    matchPrefix: "/roles",
    permissions: ["org.role.read", "org.role.assign"],
  },
  {
    to: "/account",
    labelKey: "nav.account",
    groupKey: "nav_groups.account",
    icon: UserRoundIcon,
    matchPrefix: "/account",
  },
]
