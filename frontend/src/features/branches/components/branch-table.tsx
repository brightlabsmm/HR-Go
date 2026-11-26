import type { SortingState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import {
  createDataTableColumns,
  DataTable,
  DataTableActions,
} from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { ColumnDialogApply } from "@/shared/hooks/use-list-table-params"
import { SELECT_FILTER_OPS, type ColumnFilterValue } from "@/util/column-filter"

import type { Branch } from "@/shared/services/branch.service"

const column = createDataTableColumns<Branch>()

interface BranchTableProps {
  data: Branch[]
  parentNames: Map<string, string>
  parentOptions: { value: string; label: string }[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFilterValue[]
  onColumnDialogApply: (update: ColumnDialogApply) => void
  onRowClick?: (branch: Branch) => void
  onEdit: (branch: Branch) => void
  onDelete: (branch: Branch) => void
}

export function BranchTable({
  data,
  parentNames,
  parentOptions,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnDialogApply,
  onRowClick,
  onEdit,
  onDelete,
}: BranchTableProps) {
  const { t } = useTranslation("branches")
  const { t: tCommon } = useTranslation("common")
  const empty = t("empty_value")
  const statusOptions = [
    { value: "ACTIVE", label: tCommon("status.active") },
    { value: "INACTIVE", label: tCommon("status.inactive") },
  ]
  const columns = column.columns([
    column.accessor("branchCode", {
      id: "code",
      header: t("columns.code"),
      enableSorting: true,
      meta: {
        filter: {
          field: "code",
          valueType: "text",
          defaultOp: "ilike",
        },
      },
    }),
    column.accessor("branchName", {
      id: "name",
      header: t("columns.name"),
      enableSorting: true,
      meta: {
        filter: {
          field: "name",
          valueType: "text",
          defaultOp: "ilike",
        },
      },
    }),
    column.accessor("parentId", {
      id: "parentId",
      header: t("columns.parent"),
      enableSorting: false,
      meta: {
        filter: {
          field: "parentId",
          valueType: "select",
          ops: SELECT_FILTER_OPS,
          defaultOp: "eq",
          options: parentOptions,
        },
      },
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (parentNames.get(value) ?? value) : empty
      },
    }),
    column.accessor("address", {
      id: "address",
      header: t("columns.address"),
      enableSorting: false,
      meta: {
        filter: {
          field: "address",
          valueType: "text",
          defaultOp: "ilike",
        },
      },
      cell: ({ getValue }) => getValue() || empty,
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: true,
      meta: {
        filter: {
          field: "status",
          valueType: "select",
          ops: SELECT_FILTER_OPS,
          defaultOp: "eq",
          options: statusOptions,
        },
      },
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.display({
      id: "actions",
      header: t("columns.actions"),
      enableSorting: false,
      enableHiding: false,
      meta: { align: "end" },
      cell: ({ row }) => (
        <DataTableActions
          onEdit={() => onEdit(row.original)}
          onDelete={
            row.original.status === "ACTIVE"
              ? () => onDelete(row.original)
              : undefined
          }
        />
      ),
    }),
  ])

  return (
    <DataTable
      tableId="branches"
      columns={columns}
      data={data}
      getRowId={(branch) => branch.id}
      label={t("title")}
      sorting={sorting}
      onSortingChange={onSortingChange}
      columnFilters={columnFilters}
      onColumnDialogApply={onColumnDialogApply}
      onRowClick={onRowClick}
    />
  )
}
