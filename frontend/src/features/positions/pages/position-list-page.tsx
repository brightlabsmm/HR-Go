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
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Button } from "@/components/ui/button"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useDeactivatePositionMutation,
  usePositionsQuery,
} from "@/shared/queries/position.query"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Position } from "@/shared/services/position.service"

const column = createDataTableColumns<Position>()
const FILTER_KEYS = ["status", "department"] as const

export function PositionListPage() {
  const { t } = useTranslation("positions")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const status =
    searchParams.get("status") === "inactive" ||
    searchParams.get("status") === "active"
      ? searchParams.get("status")
      : undefined
  const departmentId = searchParams.get("department") ?? undefined
  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const positionsQuery = usePositionsQuery({
    page,
    limit,
    status: status ?? undefined,
    departmentId,
  })
  const departmentsQuery = useDepartmentsQuery({ limit: 100 })
  const deactivateMutation = useDeactivatePositionMutation()
  const [target, setTarget] = useState<Position | null>(null)
  const rows = positionsQuery.data?.items ?? []
  const total = positionsQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty = positionsQuery.isSuccess && !hasFilters && total === 0
  const departmentNames = new Map(
    (departmentsQuery.data?.items ?? []).map((department) => [
      department.id,
      department.departmentName,
    ])
  )

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
    { value: "active", label: tCommon("status.active") },
    { value: "inactive", label: tCommon("status.inactive") },
  ]
  const departmentItems = [
    { value: "all", label: t("all_departments") },
    ...(departmentsQuery.data?.items ?? []).map((department) => ({
      value: department.id,
      label: department.departmentName,
    })),
  ]
  const columns = column.columns([
    column.accessor("positionName", { header: t("columns.name") }),
    column.accessor("positionCode", {
      header: t("columns.code"),
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("departmentId", {
      header: t("form.department"),
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (departmentNames.get(value) ?? "—") : "—"
      },
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
          onEdit={() => void navigate(`/positions/${row.original.id}/edit`)}
          onDelete={() => setTarget(row.original)}
        />
      ),
    }),
  ])

  const addButton = (
    <Button type="button" onClick={() => void navigate("/positions/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  )

  function renderBody() {
    if (positionsQuery.isPending) {
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
        columns={columns}
        data={rows}
        getRowId={(position) => position.id}
        label={t("title")}
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} actions={addButton} />
      <ListCard
        toolbar={
          <FilterBar hasFilters={hasFilters} onReset={resetFilters}>
            <FilterSelect
              items={statusItems}
              value={status ?? "all"}
              label={t("all_status")}
              onValueChange={(value) => patch("status", value)}
            />
            <FilterSelect
              items={departmentItems}
              value={departmentId ?? "all"}
              label={t("all_departments")}
              onValueChange={(value) => patch("department", value)}
              className="w-52"
            />
          </FilterBar>
        }
        footer={
          isUnfilteredEmpty ? null : (
            <Pagination
              meta={positionsQuery.data?.meta}
              isDisabled={positionsQuery.isPending}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("deactivate.title")}
        description={t("deactivate.description", {
          name: target?.positionName ?? "",
        })}
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
