import {
  CheckCircleIcon,
  PauseCircleIcon,
  RotateCcwIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  DetailActionButton,
  type DetailActionTone,
} from "@/components/common/detail-action-button"
import {
  getAvailableStatusTransitions,
  type OrganizationStatusAction,
} from "@/features/organizations/components/organization-status-menu"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

interface OrganizationStatusButtonsProps {
  organization: Organization
  onSelect: (status: OrganizationStatus) => void
  disabled?: boolean
}

export const STATUS_ACTION_CONFIG: Record<
  OrganizationStatusAction,
  {
    tone: DetailActionTone
    icon: LucideIcon
  }
> = {
  activate: {
    tone: "success",
    icon: CheckCircleIcon,
  },
  suspend: {
    tone: "warning",
    icon: PauseCircleIcon,
  },
  reactivate: {
    tone: "success",
    icon: RotateCcwIcon,
  },
}

export function OrganizationStatusButtons({
  organization,
  onSelect,
  disabled = false,
}: OrganizationStatusButtonsProps) {
  const { t } = useTranslation("organizations")
  const transitions = getAvailableStatusTransitions(organization.status)

  if (transitions.length === 0) {
    return null
  }

  return (
    <>
      {transitions.map((item) => {
        const config = STATUS_ACTION_CONFIG[item.action]
        const Icon = config.icon

        return (
          <DetailActionButton
            key={item.status}
            tone={config.tone}
            disabled={disabled}
            onClick={() => onSelect(item.status)}
          >
            <Icon />
            {t(`status_actions.${item.action}`)}
          </DetailActionButton>
        )
      })}
    </>
  )
}
