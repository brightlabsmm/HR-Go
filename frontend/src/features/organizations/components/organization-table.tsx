import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { DataTable } from "@/components/common/data-table"
import { createDataTableColumns } from "@/components/common/data-table-columns"
import { IdentityCell } from "@/components/common/identity-cell"
import { RowLinkAction } from "@/components/common/row-link-action"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate } from "@/util/format-date"

import type { Organization } from "@/shared/services/organization.service"

const column = createDataTableColumns<Organization>()

interface OrganizationTableProps {
  data: Organization[]
}

export function OrganizationTable({ data }: OrganizationTableProps) {
  const { t, i18n } = useTranslation("organizations")
  const navigate = useNavigate()
  const columns = column.columns([
    column.accessor("displayName", {
      header: t("columns.name"),
      cell: ({ row }) => (
        <IdentityCell
          name={row.original.displayName}
          secondary={row.original.legalName}
        />
      ),
    }),
    column.accessor("organizationCode", {
      header: t("columns.code"),
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("country", {
      header: t("columns.country"),
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("status", {
      header: t("columns.status"),
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.accessor("createdAt", {
      header: t("created_at"),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue(), i18n.language)}</span>
      ),
    }),
    column.display({
      id: "actions",
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      meta: { align: "end" },
      cell: ({ row }) => <RowLinkAction to={`/organizations/${row.original.id}`} />,
    }),
  ])

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(organization) => organization.id}
      label={t("title")}
      onRowClick={(organization) => void navigate(`/organizations/${organization.id}`)}
    />
  )
}
