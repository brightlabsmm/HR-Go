import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DataTable } from "@/components/common/data-table"
import { DataTableActions } from "@/components/common/data-table-actions"
import { createDataTableColumns } from "@/components/common/data-table-columns"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { IdentityCell } from "@/components/common/identity-cell"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { SearchBox } from "@/components/common/search-box"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { ToneBadge } from "@/components/common/tone-badge"
import { Button } from "@/components/ui/button"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useCurrentUserQuery } from "@/shared/queries/auth.query"
import {
  useDeactivateUserMutation,
  useUsersQuery,
} from "@/shared/queries/user.query"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { PlatformUser } from "@/shared/services/user.service"

const column = createDataTableColumns<PlatformUser>()
const FILTER_KEYS = ["search", "status"] as const
const STATUSES = ["active", "inactive"] as const

function parseStatus(value: string | null) {
  const lower = value?.toLowerCase()
  if (lower && STATUSES.includes(lower as (typeof STATUSES)[number])) {
    return lower
  }
  return undefined
}

export function UserListPage() {
  const { t } = useTranslation("users")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const search = searchParams.get("search") ?? ""
  const status = parseStatus(searchParams.get("status"))
  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))
  const usersQuery = useUsersQuery({
    page,
    limit,
    search: search || undefined,
    status,
  })
  const meQuery = useCurrentUserQuery()
  const { can } = usePermissions()
  const canCreate = can("platform.user.create")
  const canUpdate = can("platform.user.update")
  const canDeactivate = can("platform.user.deactivate")
  const deactivateMutation = useDeactivateUserMutation()
  const [target, setTarget] = useState<PlatformUser | null>(null)
  const users = usersQuery.data?.items ?? []
  const isUnfilteredEmpty =
    usersQuery.isSuccess && !hasFilters && (usersQuery.data?.meta.totalItems ?? 0) === 0

  function patch(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  function resetFilters() {
    const next = new URLSearchParams(searchParams)
    for (const key of FILTER_KEYS) {
      next.delete(key)
    }
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  const statusItems = [
    { value: "all", label: t("all_status") },
    { value: "active", label: tCommon("status.active") },
    { value: "inactive", label: tCommon("status.inactive") },
  ]
  const columns = column.columns([
    column.display({
      id: "name",
      header: t("columns.name"),
      cell: ({ row }) => <IdentityCell name={row.original.fullName} />,
    }),
    column.accessor("email", {
      header: t("columns.email"),
      cell: ({ getValue }) => (
        <span className="text-small-1 text-foreground">{getValue() ?? "—"}</span>
      ),
    }),
    column.accessor("status", {
      header: t("columns.status"),
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.accessor("roles", {
      header: t("columns.role"),
      cell: ({ getValue }) => {
        const role = getValue()[0]
        return role ? <ToneBadge tone="brand">{role.roleName}</ToneBadge> : "—"
      },
    }),
    column.display({
      id: "actions",
      header: t("columns.actions"),
      meta: { align: "end" },
      cell: ({ row }) => (
        <DataTableActions
          onEdit={
            canUpdate
              ? () => void navigate(`/users/${row.original.id}/edit`)
              : undefined
          }
          onDelete={
            canDeactivate && meQuery.data?.id !== row.original.id
              ? () => setTarget(row.original)
              : undefined
          }
        />
      ),
    }),
  ])

  const addButton = canCreate ? (
    <Button type="button" onClick={() => void navigate("/users/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  ) : null

  function renderBody() {
    if (usersQuery.isPending) {
      return <TableSkeleton columns={5} />
    }

    if (isUnfilteredEmpty) {
      return (
        <PageEmptyState
          title={t("empty.title")}
          description={t("empty.description")}
          action={addButton}
        />
      )
    }

    if (users.length === 0) {
      return (
        <PageEmptyState
          variant="no-results"
          title={tCommon("states.no_results_title")}
          description={tCommon("states.no_results_description")}
          action={
            <Button type="button" variant="outline" onClick={resetFilters}>
              {tCommon("actions.reset_filters")}
            </Button>
          }
        />
      )
    }

    return (
      <DataTable
        columns={columns}
        data={users}
        getRowId={(user) => user.id}
        label={t("title")}
        onRowClick={(user) => void navigate(`/users/${user.id}`)}
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} actions={addButton} />
      <ListCard
        toolbar={
          <FilterBar hasFilters={hasFilters} onReset={resetFilters}>
            <SearchBox
              value={search}
              onValueChange={(value) => patch({ search: value })}
              placeholder={t("search_placeholder")}
              className="w-80 max-w-full shrink-0"
            />
            <FilterSelect
              items={statusItems}
              value={status ?? "all"}
              label={t("all_status")}
              onValueChange={(value) => patch({ status: value })}
            />
          </FilterBar>
        }
        footer={
          isUnfilteredEmpty ? null : (
            <Pagination
              meta={usersQuery.data?.meta}
              isDisabled={usersQuery.isPending && !usersQuery.data}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("deactivate.title")}
        description={t("deactivate.description")}
        confirmLabel={t("deactivate.confirm")}
        isPending={deactivateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
          }
        }}
        onConfirm={() => {
          if (!target) {
            return
          }
          deactivateMutation.mutate(target.id, {
            onSuccess: () => setTarget(null),
          })
        }}
      />
    </MotionStack>
  )
}
