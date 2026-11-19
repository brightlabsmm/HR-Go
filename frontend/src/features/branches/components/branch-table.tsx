import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table"
import { DataTableActions } from "@/components/common/data-table-actions"
import { createDataTableColumns } from "@/components/common/data-table-columns"
import { StatusBadge } from "@/components/common/status-badge"

import type { Branch } from "@/shared/services/branch.service"

const column = createDataTableColumns<Branch>()

interface BranchTableProps {
  data: Branch[]
  parentNames: Map<string, string>
  onRowClick?: (branch: Branch) => void
  onEdit: (branch: Branch) => void
  onDelete: (branch: Branch) => void
}

export function BranchTable({
  data,
  parentNames,
  onRowClick,
  onEdit,
  onDelete,
}: BranchTableProps) {
  const { t } = useTranslation("branches")
  const empty = t("empty_value")
  const columns = column.columns([
    column.accessor("branchCode", { header: t("columns.code") }),
    column.accessor("branchName", { header: t("columns.name") }),
    column.accessor("parentId", {
      header: t("columns.parent"),
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (parentNames.get(value) ?? value) : empty
      },
    }),
    column.accessor("address", {
      header: t("columns.address"),
      cell: ({ getValue }) => getValue() || empty,
    }),
    column.accessor("status", {
      header: t("columns.status"),
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.display({
      id: "actions",
      header: t("columns.actions"),
      meta: { align: "end" },
      cell: ({ row }) => (
        <DataTableActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      ),
    }),
  ])

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(branch) => branch.id}
      label={t("title")}
      onRowClick={onRowClick}
    />
  )
}
