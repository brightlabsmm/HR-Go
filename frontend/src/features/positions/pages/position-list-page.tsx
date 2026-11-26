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
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Button } from "@/components/ui/button"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useListTableParams } from "@/shared/hooks/use-list-table-params"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useDeactivatePositionMutation,
  usePositionsQuery,
} from "@/shared/queries/position.query"
import { toast } from "@/shared/stores/toast.store"
import { SELECT_FILTER_OPS } from "@/util/column-filter"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Position } from "@/shared/services/position.service"

const column = createDataTableColumns<Position>()

export function PositionListPage() {
  const { t } = useTranslation("positions")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    sorting,
    setSorting,
    filters,
    applyColumnDialog,
    clearAllFilters,
    hasFilters,
    listSortParams,
    listFilterParams,
  } = useListTableParams()
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))
  const positionsQuery = usePositionsQuery({
    page,
    limit,
    ...listSortParams,
    ...listFilterParams,
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
  const departmentOptions = (departmentsQuery.data?.items ?? []).map(
    (department) => ({
      value: department.id,
      label: department.departmentName,
    })
  )
  const statusOptions = [
    { value: "ACTIVE", label: tCommon("status.active") },
    { value: "INACTIVE", label: tCommon("status.inactive") },
  ]

  const columns = column.columns([
    column.accessor("positionName", {
      id: "name",
      header: t("columns.name"),
      enableSorting: true,
      meta: {
        filter: {
          field: "name",
          valueType: "text",
          defaultOp: "ilike",
        },
      },
    }),
    column.accessor("positionCode", {
      id: "code",
      header: t("columns.code"),
      enableSorting: true,
      meta: {
        filter: {
          field: "code",
          valueType: "text",
          defaultOp: "ilike",
        },
      },
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("departmentId", {
      id: "departmentId",
      header: t("form.department"),
      enableSorting: false,
      meta: {
        filter: {
          field: "departmentId",
          valueType: "select",
          ops: SELECT_FILTER_OPS,
          defaultOp: "eq",
          options: departmentOptions,
        },
      },
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (departmentNames.get(value) ?? "—") : "—"
      },
    }),
    column.accessor("status", {
      header: t("columns.status"),
      enableSorting: true,
      meta: {
        filter: {
          field: "status",
          valueType: "select",
          ops: SELECT_FILTER_OPS,
          defaultOp: "eq",
          options: statusOptions,
        },
      },
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
          onEdit={() => void navigate(`/positions/${row.original.id}/edit`)}
          onDelete={
            row.original.status === "ACTIVE"
              ? () => window.setTimeout(() => setTarget(row.original), 0)
              : undefined
          }
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
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              {tCommon("actions.reset_filters")}
            </Button>
          }
        />
      )
    }

    return (
      <DataTable
        tableId="positions"
        columns={columns}
        data={rows}
        getRowId={(position) => position.id}
        label={t("title")}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={filters}
        onColumnDialogApply={applyColumnDialog}
        onRowClick={(position) => void navigate(`/positions/${position.id}`)}
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} actions={addButton} />
      <ListCard
        toolbar={
          <FilterBar hasFilters={hasFilters} onReset={clearAllFilters}>
            <span className="text-small-2 text-muted-foreground">
              {tCommon("table.filter_hint")}
            </span>
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
        title={t("delete.title", { name: target?.positionName ?? "" })}
        description={t("delete.description", {
          name: target?.positionName ?? "",
        })}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
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
            onSuccess: () => {
              setTarget(null)
              toast.success(t("delete.success"))
            },
            onError: () => setTarget(null),
          })
        }}
      />
    </MotionStack>
  )
}
