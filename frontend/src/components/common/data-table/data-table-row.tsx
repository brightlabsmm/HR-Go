import type { ReactNode } from "react"
import { cn } from "cn"

import { TableRow } from "@/components/ui/table"

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [role='checkbox'], [role='menuitem'], [data-slot='dropdown-menu-trigger']"

interface DataTableRowProps {
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function DataTableRow({ className, children, onClick }: DataTableRowProps) {
  return (
    <TableRow
      className={cn("h-20 md:h-16", onClick && "cursor-pointer", className)}
      onClick={
        onClick
          ? (event) => {
              const target = event.target as HTMLElement
              if (target.closest(INTERACTIVE_SELECTOR)) {
                return
              }
              onClick()
            }
          : undefined
      }
    >
      {children}
    </TableRow>
  )
}
