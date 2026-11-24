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
    <div
      className={cn(
        "flex flex-col gap-2 p-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
        className
      )}
    >
      {children}
      {onReset ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full shrink-0 justify-start text-primary sm:w-auto"
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
