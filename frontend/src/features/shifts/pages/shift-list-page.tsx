import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import {
  createDataTableColumns,
  DataTable,
  DataTableActions,
} from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { notifyApiError } from "@/app/api/feedback"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeleteShiftMutation,
  useShiftsQuery,
} from "@/shared/queries/shift.query"
import { toast } from "@/shared/stores/toast.store"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Shift } from "@/shared/services/shift.service"

const column = createDataTableColumns<Shift>()
const FILTER_KEYS = ["status", "branch", "q"] as const

export function ShiftListPage() {
  const { t } = useTranslation("shifts")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const canCreate = can("org.shift.create")
  const canUpdate = can("org.shift.update")
  const canDelete = can("org.shift.delete")

  const status = searchParams.get("status") ?? undefined
  const branchId = searchParams.get("branch") ?? undefined
  const search = searchParams.get("q") ?? undefined

  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const shiftsQuery = useShiftsQuery({
    page,
    limit,
    status,
    branchId,
    search,
  })

  const branchesQuery = useBranchesQuery({ limit: 100 })
  const deleteMutation = useDeleteShiftMutation()

  const [target, setTarget] = useState<Shift | null>(null)
  const rows = shiftsQuery.data?.items ?? []
  const total = shiftsQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty = shiftsQuery.isSuccess && !hasFilters && total === 0

  function patch(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === "all") {
      next.delete(key)
    } else {
      next.set(key, value)
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
    { value: "ACTIVE", label: t("status.ACTIVE") },
    { value: "INACTIVE", label: t("status.INACTIVE") },
  ]

  const branchItems = [
    { value: "all", label: t("all_branches") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const columns = column.columns([
    column.accessor("shiftName", {
      header: t("columns.name"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {row.original.shiftName}
          </span>
          {row.original.isDefault && (
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {t("default_badge")}
            </Badge>
          )}
        </div>
      ),
    }),
    column.accessor("startTime", {
      header: t("columns.timing"),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-small-2 text-foreground">
          {row.original.startTime} - {row.original.endTime}
        </span>
      ),
    }),
    column.accessor("breakMinutes", {
      header: t("columns.break"),
      enableSorting: false,
      cell: ({ getValue }) => t("mins_unit", { count: getValue() }),
    }),
    column.accessor("branchName", {
      header: t("columns.branch"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || t("all_branches_label"),
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: false,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    ...(canUpdate || canDelete
      ? [
          column.display({
            id: "actions",
            header: t("columns.actions"),
            enableSorting: false,
            enableHiding: false,
            meta: { align: "end" },
            cell: ({ row }) => (
              <DataTableActions
                onEdit={
                  canUpdate
                    ? () => void navigate(`/shifts/${row.original.id}/edit`)
                    : undefined
                }
                onDelete={
                  canDelete
                    ? () => window.setTimeout(() => setTarget(row.original), 0)
                    : undefined
                }
              />
            ),
          }),
        ]
      : []),
  ])

  const addButton = canCreate ? (
    <Button type="button" onClick={() => void navigate("/shifts/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  ) : null

  function renderBody() {
    if (shiftsQuery.isPending) {
      return <TableSkeleton columns={6} />
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

    if (rows.length === 0) {
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
        tableId="shifts"
        columns={columns}
        data={rows}
        getRowId={(shift) => shift.id}
        label={t("title")}
        onRowClick={
          canUpdate ? (shift) => void navigate(`/shifts/${shift.id}/edit`) : undefined
        }
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={addButton}
      />
      <ListCard
        toolbar={
          <FilterBar hasFilters={hasFilters} onReset={resetFilters}>
            <div className="w-56">
              <Input
                placeholder={t("search_placeholder")}
                value={search ?? ""}
                onChange={(e) => patch("q", e.target.value || null)}
                className="h-9"
              />
            </div>
            <FilterSelect
              items={statusItems}
              value={status ?? "all"}
              label={t("all_status")}
              onValueChange={(val) => patch("status", val)}
              className="w-40"
            />
            <FilterSelect
              items={branchItems}
              value={branchId ?? "all"}
              label={t("all_branches")}
              onValueChange={(val) => patch("branch", val)}
              className="w-44"
            />
          </FilterBar>
        }
        footer={
          isUnfilteredEmpty ? null : (
            <Pagination
              meta={shiftsQuery.data?.meta}
              isDisabled={shiftsQuery.isPending}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("delete.title", { name: target?.shiftName ?? "" })}
        description={t("delete.description", {
          name: target?.shiftName ?? "",
        })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
          }
        }}
        onConfirm={() => {
          if (!target) return
          deleteMutation.mutate(target.id, {
            onSuccess: () => {
              setTarget(null)
              toast.success(t("delete.success"))
            },
            onError: (err) => {
              setTarget(null)
              notifyApiError(err)
            },
          })
        }}
      />
    </MotionStack>
  )
}
