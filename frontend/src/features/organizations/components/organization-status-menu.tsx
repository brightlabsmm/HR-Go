import { cn } from "cn"
import { MoreHorizontalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/components/common/status-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

const ORGANIZATION_STATUSES: OrganizationStatus[] = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]

const HIGH_IMPACT_STATUSES = new Set<OrganizationStatus>(["SUSPENDED", "ARCHIVED"])

interface OrganizationStatusMenuProps {
  organization: Organization
  onSelect: (status: OrganizationStatus) => void
}

export function isHighImpactOrganizationStatus(status: OrganizationStatus) {
  return HIGH_IMPACT_STATUSES.has(status)
}

export function toOrganizationStatus(status: string): OrganizationStatus | null {
  const normalized = status.toUpperCase()
  return ORGANIZATION_STATUSES.find((item) => item === normalized) ?? null
}

export function OrganizationStatusMenu({
  organization,
  onSelect,
}: OrganizationStatusMenuProps) {
  const { t } = useTranslation("organizations")
  const current = toOrganizationStatus(organization.status)
  const options = ORGANIZATION_STATUSES.filter((status) => status !== current)

  if (options.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("status_change.menu")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "cursor-pointer text-muted-foreground"
        )}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("status_change.menu")}</DropdownMenuLabel>
          {options.map((status) => (
            <DropdownMenuItem
              key={status}
              className="cursor-pointer"
              onClick={() => onSelect(status)}
            >
              <StatusBadge status={status} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
