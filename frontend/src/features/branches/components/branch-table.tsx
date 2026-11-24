import type { SortingState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import {
  createDataTableColumns,
  DataTable,
  DataTableActions,
} from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"

import type { Branch } from "@/shared/services/branch.service"

const column = createDataTableColumns<Branch>()

interface BranchTableProps {
  data: Branch[]
  parentNames: Map<string, string>
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  onRowClick?: (branch: Branch) => void
  onEdit: (branch: Branch) => void
  onDelete: (branch: Branch) => void
}

export function BranchTable({
  data,
  parentNames,
  sorting,
  onSortingChange,
  onRowClick,
  onEdit,
  onDelete,
}: BranchTableProps) {
  const { t } = useTranslation("branches")
  const empty = t("empty_value")
  const columns = column.columns([
    column.accessor("branchCode", {
      id: "code",
      header: t("columns.code"),
      enableSorting: true,
    }),
    column.accessor("branchName", {
      id: "name",
      header: t("columns.name"),
      enableSorting: true,
    }),
    column.accessor("parentId", {
      header: t("columns.parent"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (parentNames.get(value) ?? value) : empty
      },
    }),
    column.accessor("address", {
      header: t("columns.address"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || empty,
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: true,
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
      onRowClick={onRowClick}
    />
  )
}
