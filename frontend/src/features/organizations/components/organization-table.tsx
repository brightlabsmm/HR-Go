import type { SortingState } from "@tanstack/react-table"
import { ClockIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import {
  createDataTableColumns,
  DataTable,
  DataTableActions,
} from "@/components/common/data-table"
import { IdentityCell } from "@/components/common/identity-cell"
import { StatusBadge } from "@/components/common/status-badge"
import {
  getAvailableStatusTransitions,
  OrganizationStatusMenuItems,
} from "@/features/organizations/components/organization-status-menu"
import { getCountryLabel } from "@/constants/countries"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { formatDate, formatDateTime } from "@/util/format-date"
import { isDeletableOrganization } from "@/features/organizations/util/organization-rules"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

const column = createDataTableColumns<Organization>()

interface OrganizationTableProps {
  data: Organization[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  onChangeStatus?: (organization: Organization, status: OrganizationStatus) => void
  onDelete?: (organization: Organization) => void
}

export function OrganizationTable({
  data,
  sorting,
  onSortingChange,
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
      id: "displayName",
      header: t("columns.name"),
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell
          name={row.original.displayName}
          secondary={row.original.legalName}
        />
      ),
    }),
    column.accessor("organizationCode", {
      id: "code",
      header: t("columns.code"),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("contactEmail", {
      header: t("columns.email"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("country", {
      header: t("columns.country"),
      enableSorting: false,
      cell: ({ getValue }) => getCountryLabel(getValue()),
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: true,
      cell: ({ row, getValue }) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={getValue()} />
          {row.original.scheduledSuspendAt ? (
            <span
              title={formatDateTime(row.original.scheduledSuspendAt, i18n.language)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"
            >
              <ClockIcon className="size-3" />
              {t("suspend_dialog.scheduled_badge", "Suspension scheduled")}
            </span>
          ) : null}
        </div>
      ),
    }),
    column.accessor("createdAt", {
      header: t("created_at"),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue(), i18n.language)}</span>
      ),
    }),
    column.display({
      id: "actions",
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      enableSorting: false,
      enableHiding: false,
      meta: { align: "end" },
      cell: ({ row }) => {
        const organization = row.original
        const statusItems =
          canChangeStatus && onChangeStatus
            ? getAvailableStatusTransitions(organization.status)
            : []

        return (
          <DataTableActions
            onEdit={
              canUpdate
                ? () => void navigate(`/organizations/${organization.id}/edit`)
                : undefined
            }
            extraItems={
              statusItems.length > 0 ? (
                <OrganizationStatusMenuItems
                  organization={organization}
                  onSelect={(status) => onChangeStatus?.(organization, status)}
                />
              ) : undefined
            }
            onDelete={
              isDeletableOrganization(organization, canDelete) && onDelete
                ? () => onDelete(organization)
                : undefined
            }
          />
        )
      },
    }),
  ])

  return (
    <DataTable
      tableId="organizations"
      columns={columns}
      data={data}
      getRowId={(organization) => organization.id}
      label={t("title")}
      sorting={sorting}
      onSortingChange={onSortingChange}
      onRowClick={(organization) => void navigate(`/organizations/${organization.id}`)}
    />
  )
}
