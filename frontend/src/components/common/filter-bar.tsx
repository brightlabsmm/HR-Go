import type { ReactNode } from "react"
import { cn } from "cn"
import { RotateCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface FilterBarProps {
  hasFilters?: boolean
  onReset?: () => void
  className?: string
  children: ReactNode
}

export function FilterBar({
  hasFilters = false,
  onReset,
  className,
  children,
}: FilterBarProps) {
  const { t } = useTranslation("common")

  return (
    <div className={cn("flex flex-wrap items-center gap-3 p-0.5", className)}>
      {children}
      {onReset ? (
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 text-primary"
          disabled={!hasFilters}
          onClick={onReset}
        >
          <RotateCcwIcon className="size-4" />
          {t("actions.reset_filters")}
        </Button>
      ) : null}
    </div>
  )
}
