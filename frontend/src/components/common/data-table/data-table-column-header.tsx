import type { ReactNode } from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

interface DataTableColumnHeaderProps {
  canSort?: boolean
  sorted?: false | "asc" | "desc"
  onSort?: (event: unknown) => void
  children: ReactNode
}

export function DataTableColumnHeader({
  canSort = false,
  sorted = false,
  onSort,
  children,
}: DataTableColumnHeaderProps) {
  const { t } = useTranslation("common")
  const SortIcon =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon

  if (!canSort) {
    return children
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-2 h-8 gap-1.5 px-2 text-small-2 font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
        sorted && "text-foreground"
      )}
      onClick={(event) => onSort?.(event)}
      aria-label={
        sorted === "desc" ? t("table.clear_sort") : t("table.sort_desc")
      }
    >
      {children}
      <SortIcon className="size-3.5" aria-hidden />
    </Button>
  )
}
