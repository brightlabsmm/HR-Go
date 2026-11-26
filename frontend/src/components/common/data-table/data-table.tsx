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
import type { ColumnDialogApply } from "@/shared/hooks/use-list-table-params"
import type { ColumnFilterValue } from "@/util/column-filter"

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
  columnFilters?: ColumnFilterValue[]
  onColumnDialogApply?: (update: ColumnDialogApply) => void
  enableColumnVisibility?: boolean
  onRowClick?: (row: TData) => void
}

const VISIBILITY_STORAGE_PREFIX = "hrgo.table.columns."

function alignClass(align: "start" | "end" | undefined) {
  return align === "end" ? "text-right" : undefined
}

function hideBelowClass(hideBelow: "sm" | "md" | "lg" | undefined) {
  if (hideBelow === "sm") {
    return "hidden sm:table-cell"
  }
  if (hideBelow === "md") {
    return "hidden md:table-cell"
  }
  if (hideBelow === "lg") {
    return "hidden lg:table-cell"
  }
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
  columnFilters,
  onColumnDialogApply,
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
  const activeSorting: SortingState = sorting ?? []

  function handleColumnDialogApply(update: ColumnDialogApply) {
    if (onColumnDialogApply) {
      onColumnDialogApply(update)
      return
    }
    onSortingChange?.(update.sorting)
  }

  return (
    <table.AppTable>
      {enableColumnVisibility ? (
        <div className="mb-2 hidden justify-end md:flex">
          <DataTableColumnToggle />
        </div>
      ) : null}
      <Table className={className} aria-label={label}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <DataTableRow key={headerGroup.id} className="h-12 hover:bg-transparent md:h-11">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const sortIndex = activeSorting.findIndex(
                  (item) => item.id === header.column.id
                )
                const headerDef = header.column.columnDef.header
                const titleLabel =
                  typeof headerDef === "string" ? headerDef : header.column.id

                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    className={cn(
                      alignClass(meta?.align),
                      hideBelowClass(meta?.hideBelow),
                      meta?.headerClassName
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <DataTableColumnHeader
                        title={titleLabel}
                        columnId={header.column.id}
                        canSort={header.column.getCanSort()}
                        sorted={header.column.getIsSorted()}
                        sortIndex={
                          activeSorting.length > 1 && sortIndex >= 0
                            ? sortIndex
                            : undefined
                        }
                        sorting={activeSorting}
                        filterMeta={meta?.filter}
                        columnFilters={columnFilters}
                        onColumnDialogApply={
                          onColumnDialogApply || onSortingChange
                            ? handleColumnDialogApply
                            : undefined
                        }
                      />
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
                      className={cn(
                        alignClass(meta?.align),
                        hideBelowClass(meta?.hideBelow),
                        meta?.cellClassName
                      )}
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
