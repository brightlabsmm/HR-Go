import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { DataTable } from "@/components/common/data-table"
import { DataTableActions } from "@/components/common/data-table-actions"
import { createDataTableColumns } from "@/components/common/data-table-columns"
import { IdentityCell } from "@/components/common/identity-cell"
import { StatusBadge } from "@/components/common/status-badge"
import { OrganizationStatusMenu } from "@/features/organizations/components/organization-status-menu"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { formatDate } from "@/util/format-date"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

const column = createDataTableColumns<Organization>()

interface OrganizationTableProps {
  data: Organization[]
  onChangeStatus?: (organization: Organization, status: OrganizationStatus) => void
  onDelete?: (organization: Organization) => void
}

export function OrganizationTable({
  data,
  onChangeStatus,
  onDelete,
}: OrganizationTableProps) {
  const { t, i18n } = useTranslation("organizations")
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canUpdate = can("platform.organization.update")
  const canChangeStatus = can("platform.organization.status.update")
  const canDelete = can("platform.organization.delete")
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
    column.accessor("contactEmail", {
      header: t("columns.email"),
      cell: ({ getValue }) => getValue() || "—",
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
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          <DataTableActions
            onEdit={
              canUpdate
                ? () => void navigate(`/organizations/${row.original.id}/edit`)
                : undefined
            }
            onDelete={
              canDelete && onDelete ? () => onDelete(row.original) : undefined
            }
          />
          {canChangeStatus && onChangeStatus ? (
            <OrganizationStatusMenu
              organization={row.original}
              onSelect={(status) => onChangeStatus(row.original, status)}
            />
          ) : null}
        </div>
      ),
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
