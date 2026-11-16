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

export type OrganizationStatusAction =
  | "activate"
  | "suspend"
  | "archive"
  | "reactivate"

export interface OrganizationStatusTransition {
  status: OrganizationStatus
  action: OrganizationStatusAction
}

export const ORGANIZATION_STATUS_TRANSITIONS: Record<
  OrganizationStatus,
  OrganizationStatusTransition[]
> = {
  PENDING: [{ status: "ACTIVE", action: "activate" }],
  ACTIVE: [
    { status: "SUSPENDED", action: "suspend" },
    { status: "ARCHIVED", action: "archive" },
  ],
  SUSPENDED: [
    { status: "ACTIVE", action: "reactivate" },
    { status: "ARCHIVED", action: "archive" },
  ],
  ARCHIVED: [{ status: "ACTIVE", action: "reactivate" }],
}

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

export function getAvailableStatusTransitions(
  status: string
): OrganizationStatusTransition[] {
  const normalized = toOrganizationStatus(status)
  if (!normalized) return []
  return ORGANIZATION_STATUS_TRANSITIONS[normalized] ?? []
}

export function OrganizationStatusMenu({
  organization,
  onSelect,
}: OrganizationStatusMenuProps) {
  const { t } = useTranslation("organizations")
  const transitions = getAvailableStatusTransitions(organization.status)

  if (transitions.length === 0) {
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
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("status_change.menu")}</DropdownMenuLabel>
          {transitions.map((item) => (
            <DropdownMenuItem
              key={item.status}
              className="flex cursor-pointer items-center justify-between gap-3"
              onClick={() => onSelect(item.status)}
            >
              <span className="font-medium text-foreground">
                {t(`status_actions.${item.action}`)}
              </span>
              <StatusBadge status={item.status} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
