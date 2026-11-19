import {
  CheckCircleIcon,
  PauseCircleIcon,
  RotateCcwIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

const ORGANIZATION_STATUSES: OrganizationStatus[] = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
]

const HIGH_IMPACT_STATUSES = new Set<OrganizationStatus>(["SUSPENDED"])

export type OrganizationStatusAction =
  | "activate"
  | "suspend"
  | "reactivate"

const STATUS_ACTION_ICONS: Record<OrganizationStatusAction, LucideIcon> = {
  activate: CheckCircleIcon,
  suspend: PauseCircleIcon,
  reactivate: RotateCcwIcon,
}

export interface OrganizationStatusTransition {
  status: OrganizationStatus
  action: OrganizationStatusAction
}

export const ORGANIZATION_STATUS_TRANSITIONS: Record<
  OrganizationStatus,
  OrganizationStatusTransition[]
> = {
  PENDING: [{ status: "ACTIVE", action: "activate" }],
  ACTIVE: [{ status: "SUSPENDED", action: "suspend" }],
  SUSPENDED: [{ status: "ACTIVE", action: "reactivate" }],
}

interface OrganizationStatusMenuItemsProps {
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

export function getStatusDialogContent(
  currentStatus: string,
  targetStatus: OrganizationStatus,
  name: string,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const normCurrent = toOrganizationStatus(currentStatus)
  const transition = normCurrent
    ? ORGANIZATION_STATUS_TRANSITIONS[normCurrent]?.find((tr) => tr.status === targetStatus)
    : null
  const action =
    transition?.action ?? (targetStatus === "ACTIVE" ? "activate" : targetStatus.toLowerCase())

  switch (action) {
    case "activate":
      return {
        title: t("status_confirm.activate_title", { name, defaultValue: `Activate ${name}?` }),
        description: t("status_confirm.activate_description", {
          name,
          defaultValue: `This will set ${name} to Active. The change takes effect immediately.`,
        }),
        confirmLabel: t("status_actions.activate", { defaultValue: "Activate" }),
      }
    case "reactivate":
      return {
        title: t("status_confirm.reactivate_title", { name, defaultValue: `Reactivate ${name}?` }),
        description: t("status_confirm.reactivate_description", {
          name,
          defaultValue: `This will reactivate ${name} and restore workspace access.`,
        }),
        confirmLabel: t("status_actions.reactivate", { defaultValue: "Reactivate" }),
      }
    case "suspend":
      return {
        title: t("status_confirm.suspend_title", { name, defaultValue: `Suspend ${name}?` }),
        description: t("status_confirm.suspend_description", {
          name,
          defaultValue: `This will suspend ${name}. Workspace users will be logged out and unable to access the organization.`,
        }),
        confirmLabel: t("status_actions.suspend", { defaultValue: "Suspend" }),
      }
    default:
      return {
        title: t("status_change.title", { status: targetStatus }),
        description: t("status_change.description", { name, status: targetStatus }),
        confirmLabel: t("status_change.confirm"),
      }
  }
}

export function OrganizationStatusMenuItems({
  organization,
  onSelect,
}: OrganizationStatusMenuItemsProps) {
  const { t } = useTranslation("organizations")
  const transitions = getAvailableStatusTransitions(organization.status)

  if (transitions.length === 0) {
    return null
  }

  return (
    <>
      {transitions.map((item) => {
        const Icon = STATUS_ACTION_ICONS[item.action]

        return (
          <DropdownMenuItem
            key={item.status}
            className="cursor-pointer"
            onClick={() => onSelect(item.status)}
          >
            <Icon />
            {t(`status_actions.${item.action}`)}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}
