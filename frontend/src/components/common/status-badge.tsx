import { cn } from "cn"
import { useTranslation } from "react-i18next"

export type StatusBadgeStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending"

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CLASS: Record<StatusBadgeStatus, string> = {
  active: "bg-success-muted text-success",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-warning-muted text-warning-foreground",
  pending: "bg-info-muted text-info",
}

function resolveStatus(status: string): StatusBadgeStatus {
  const normalized = status.toLowerCase()
  if (
    normalized === "active" ||
    normalized === "suspended" ||
    normalized === "pending"
  ) {
    return normalized
  }

  return "inactive"
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation("common")
  const resolved = resolveStatus(status)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-small-2 font-medium",
        STATUS_CLASS[resolved],
        className
      )}
    >
      <i
        className={cn(
          "inline-block size-1.5 rounded-full bg-current",
          resolved === "suspended" && "bg-warning"
        )}
        aria-hidden
      />
      {t(`status.${resolved}`)}
    </span>
  )
}
