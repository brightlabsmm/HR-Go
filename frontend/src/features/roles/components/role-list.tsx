import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { DataTable } from "@/components/common/data-table"
import { createDataTableColumns } from "@/components/common/data-table-columns"
import { ListCard } from "@/components/common/list-card"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { ToneBadge } from "@/components/common/tone-badge"
import { useRolesQuery } from "@/shared/queries/role.query"

import type { Role } from "@/shared/services/role.service"

const column = createDataTableColumns<Role>()

export function RoleList() {
  const { t } = useTranslation("roles")
  const navigate = useNavigate()
  const rolesQuery = useRolesQuery()
  const roles = rolesQuery.data ?? []
  const columns = column.columns([
    column.accessor("roleName", {
      header: t("columns.name"),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground">{row.original.roleName}</span>
          {row.original.description ? (
            <span className="max-w-md truncate text-small-2 text-muted-foreground">
              {row.original.description}
            </span>
          ) : null}
        </div>
      ),
    }),
    column.accessor("roleCode", {
      header: t("columns.code"),
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("permissions", {
      header: t("form.permissions"),
      cell: ({ getValue }) => (
        <ToneBadge tone="brand">{t("selected_count", { count: getValue().length })}</ToneBadge>
      ),
    }),
  ])

  function renderBody() {
    if (rolesQuery.isPending) {
      return <TableSkeleton columns={3} />
    }

    if (roles.length === 0) {
      return (
        <PageEmptyState title={t("empty.title")} description={t("empty.description")} />
      )
    }

    return (
      <DataTable
        columns={columns}
        data={roles}
        getRowId={(role) => role.id}
        label={t("title")}
        onRowClick={(role) => void navigate(`/roles/${role.id}`)}
      />
    )
  }

  return <ListCard>{renderBody()}</ListCard>
}
