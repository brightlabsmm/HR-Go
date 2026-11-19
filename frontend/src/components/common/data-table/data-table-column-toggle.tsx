import { SlidersHorizontalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"

import { useDataTableContext } from "@/components/common/data-table/data-table-columns"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DataTableColumnToggle() {
  const { t } = useTranslation("common")
  const table = useDataTableContext()
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

  if (hideableColumns.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("table.toggle_columns")}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <SlidersHorizontalIcon className="size-4" />
        {t("table.columns")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("table.columns")}</DropdownMenuLabel>
          {hideableColumns.map((column) => {
            const label = column.columnDef.header
            const text = typeof label === "string" ? label : column.id

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) =>
                  column.toggleVisibility(Boolean(checked))
                }
              >
                {text}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
