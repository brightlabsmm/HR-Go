import type { LucideIcon } from "lucide-react"

export interface PortalNavItem {
  to: string
  end?: boolean
  labelKey: string
  groupKey: string
  icon: LucideIcon
  matchPrefix?: string
  permission?: string
}
