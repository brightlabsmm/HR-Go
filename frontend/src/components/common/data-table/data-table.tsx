import { useState } from "react"
import type { ColumnDef, RowData, SortingState, Updater } from "@tanstack/react-table"
import { cn } from "cn"
import { useTranslation } from "react-i18next"

import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableColumnToggle } from "@/components/common/data-table/data-table-column-toggle"
import {
  dataTableFeatures,
  useDataTable,
} from "@/components/common/data-table/data-table-columns"
import { DataTableRow } from "@/components/common/data-table/data-table-row"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<typeof dataTableFeatures, TData>[]
  data: TData[]
  tableId?: string
  getRowId?: (row: TData, index: number) => string
  emptyMessage?: string
  className?: string
  label?: string
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  enableColumnVisibility?: boolean
  onRowClick?: (row: TData) => void
}

const VISIBILITY_STORAGE_PREFIX = "hrgo.table.columns."

function alignClass(align: "start" | "end" | undefined) {
  return align === "end" ? "text-right" : undefined
}

function readStoredVisibility(tableId: string) {
  try {
    const raw = localStorage.getItem(`${VISIBILITY_STORAGE_PREFIX}${tableId}`)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function resolveUpdater<T>(updater: Updater<T>, current: T) {
  return typeof updater === "function"
    ? (updater as (value: T) => T)(current)
    : updater
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  tableId,
  getRowId,
  emptyMessage,
  className,
  label,
  sorting,
  onSortingChange,
  enableColumnVisibility = true,
  onRowClick,
}: DataTableProps<TData>) {
  const { t } = useTranslation("common")
  const [columnVisibility, setColumnVisibility] = useState(() =>
    tableId ? readStoredVisibility(tableId) : {}
  )
  const isServerSorted = Boolean(onSortingChange)
  const table = useDataTable({
    columns,
    data,
    getRowId,
    manualSorting: isServerSorted,
    enableSortingRemoval: true,
    sortDescFirst: true,
    enableMultiSort: true,
    state: {
      columnVisibility,
      ...(sorting !== undefined ? { sorting } : {}),
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((current) => {
        const next = resolveUpdater(updater, current)
        if (tableId) {
          localStorage.setItem(
            `${VISIBILITY_STORAGE_PREFIX}${tableId}`,
            JSON.stringify(next)
          )
        }
        return next
      })
    },
    onSortingChange: onSortingChange
      ? (updater) => {
          onSortingChange(resolveUpdater(updater, sorting ?? []))
        }
      : undefined,
  })
  const rows = table.getRowModel().rows
  const columnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const resolvedEmpty = emptyMessage ?? t("table.empty")

  return (
    <table.AppTable>
      {enableColumnVisibility ? (
        <div className="mb-2 flex justify-end">
          <DataTableColumnToggle />
        </div>
      ) : null}
      <Table className={className} aria-label={label}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <DataTableRow key={headerGroup.id} className="h-11 hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta

                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className={cn(alignClass(meta?.align), meta?.headerClassName)}
                  >
                    {header.isPlaceholder ? null : (
                      <DataTableColumnHeader
                        canSort={header.column.getCanSort()}
                        sorted={header.column.getIsSorted()}
                        onSort={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                      </DataTableColumnHeader>
                    )}
                  </TableHead>
                )
              })}
            </DataTableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <DataTableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => {
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
              </DataTableRow>
            ))
          ) : (
            <DataTableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                {resolvedEmpty}
              </TableCell>
            </DataTableRow>
          )}
        </TableBody>
      </Table>
    </table.AppTable>
  )
}

export type { DataTableProps }
