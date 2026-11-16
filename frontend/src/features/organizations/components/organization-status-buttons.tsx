import type { ReactNode } from "react"
import {
  ArchiveIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  RotateCcwIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
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
    className: string
    icon: ReactNode
  }
> = {
  activate: {
    className:
      "border-success/40 bg-success-muted/30 text-success hover:border-success/60 hover:bg-success-muted hover:text-success dark:border-success/40 dark:bg-success-muted/20 dark:hover:bg-success-muted/40",
    icon: <CheckCircleIcon className="size-4" />,
  },
  suspend: {
    className:
      "border-warning/60 bg-warning-muted/40 text-warning-foreground hover:border-warning hover:bg-warning-muted hover:text-warning-foreground dark:border-warning/50 dark:bg-warning-muted/20 dark:text-warning dark:hover:bg-warning-muted/40",
    icon: <PauseCircleIcon className="size-4" />,
  },
  archive: {
    className:
      "border-destructive/40 bg-destructive-muted/20 text-destructive hover:border-destructive/60 hover:bg-destructive-muted hover:text-destructive dark:border-destructive/40 dark:bg-destructive-muted/20 dark:hover:bg-destructive-muted/40",
    icon: <ArchiveIcon className="size-4" />,
  },
  reactivate: {
    className:
      "border-success/40 bg-success-muted/30 text-success hover:border-success/60 hover:bg-success-muted hover:text-success dark:border-success/40 dark:bg-success-muted/20 dark:hover:bg-success-muted/40",
    icon: <RotateCcwIcon className="size-4" />,
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
        return (
          <Button
            key={item.status}
            type="button"
            variant="outline"
            disabled={disabled}
            className={config.className}
            onClick={() => onSelect(item.status)}
          >
            {config.icon}
            {t(`status_actions.${item.action}`)}
          </Button>
        )
      })}
    </>
  )
}
