import type { ColumnDef, RowData } from "@tanstack/react-table"
import { cn } from "cn"
import { useTranslation } from "react-i18next"

import {
  dataTableFeatures,
  useDataTable,
} from "@/components/common/data-table-columns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<typeof dataTableFeatures, TData>[]
  data: TData[]
  getRowId?: (row: TData, index: number) => string
  emptyMessage?: string
  className?: string
  label?: string
  onRowClick?: (row: TData) => void
}

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, [role='checkbox'], [role='menuitem'], [data-slot='dropdown-menu-trigger']"

function alignClass(align: "start" | "end" | undefined) {
  return align === "end" ? "text-right" : undefined
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  emptyMessage,
  className,
  label,
  onRowClick,
}: DataTableProps<TData>) {
  const { t } = useTranslation("common")
  const table = useDataTable({ columns, data, getRowId })
  const rows = table.getRowModel().rows
  const columnCount = Math.max(table.getAllLeafColumns().length, 1)
  const resolvedEmpty = emptyMessage ?? t("table.empty")

  return (
    <table.AppTable>
      <Table className={className} aria-label={label}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta

                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className={cn(
                      alignClass(meta?.align),
                      meta?.headerClassName
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn("h-16", onRowClick && "cursor-pointer")}
                onClick={
                  onRowClick
                    ? (event) => {
                        const target = event.target as HTMLElement
                        if (target.closest(INTERACTIVE_SELECTOR)) {
                          return
                        }
                        onRowClick(row.original)
                      }
                    : undefined
                }
              >
                {row.getAllCells().map((cell) => {
                  const meta = cell.column.columnDef.meta

                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(alignClass(meta?.align), meta?.cellClassName)}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {resolvedEmpty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </table.AppTable>
  )
}

export type { DataTableProps }
