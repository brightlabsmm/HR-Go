import type { SortingState } from "@tanstack/react-table"
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
import { formatDate } from "@/util/format-date"

import type {
  Organization,
  OrganizationStatus,
} from "@/shared/services/organization.service"

const column = createDataTableColumns<Organization>()

// Below md only Name, Status and Actions stay, so the table fits a phone without sideways scroll.
const DESKTOP_ONLY_CLASS = "hidden md:table-cell"
const COMPACT_CELL_CLASS = "px-2 md:px-4"

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
      meta: { headerClassName: COMPACT_CELL_CLASS, cellClassName: COMPACT_CELL_CLASS },
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
      meta: { headerClassName: DESKTOP_ONLY_CLASS, cellClassName: DESKTOP_ONLY_CLASS },
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("contactEmail", {
      header: t("columns.email"),
      enableSorting: false,
      meta: { headerClassName: DESKTOP_ONLY_CLASS, cellClassName: DESKTOP_ONLY_CLASS },
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("country", {
      header: t("columns.country"),
      enableSorting: false,
      meta: { headerClassName: DESKTOP_ONLY_CLASS, cellClassName: DESKTOP_ONLY_CLASS },
      cell: ({ getValue }) => getCountryLabel(getValue()),
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: true,
      meta: { headerClassName: COMPACT_CELL_CLASS, cellClassName: COMPACT_CELL_CLASS },
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.accessor("createdAt", {
      header: t("created_at"),
      enableSorting: true,
      meta: { headerClassName: DESKTOP_ONLY_CLASS, cellClassName: DESKTOP_ONLY_CLASS },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue(), i18n.language)}</span>
      ),
    }),
    column.display({
      id: "actions",
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "end",
        headerClassName: COMPACT_CELL_CLASS,
        cellClassName: COMPACT_CELL_CLASS,
      },
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
              canDelete && onDelete ? () => onDelete(organization) : undefined
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
