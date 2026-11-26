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
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeactivateDepartmentMutation,
  useDepartmentsQuery,
} from "@/shared/queries/department.query"
import { toast } from "@/shared/stores/toast.store"
import { SELECT_FILTER_OPS } from "@/util/column-filter"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Department } from "@/shared/services/department.service"

const column = createDataTableColumns<Department>()

export function DepartmentListPage() {
  const { t } = useTranslation("departments")
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
  const departmentsQuery = useDepartmentsQuery({
    page,
    limit,
    ...listSortParams,
    ...listFilterParams,
  })
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const deactivateMutation = useDeactivateDepartmentMutation()
  const [target, setTarget] = useState<Department | null>(null)
  const rows = departmentsQuery.data?.items ?? []
  const total = departmentsQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty = departmentsQuery.isSuccess && !hasFilters && total === 0
  const branchNames = new Map(
    (branchesQuery.data?.items ?? []).map((branch) => [branch.id, branch.branchName])
  )
  const branchOptions = (branchesQuery.data?.items ?? []).map((branch) => ({
    value: branch.id,
    label: branch.branchName,
  }))
  const statusOptions = [
    { value: "ACTIVE", label: tCommon("status.active") },
    { value: "INACTIVE", label: tCommon("status.inactive") },
  ]

  const columns = column.columns([
    column.accessor("departmentName", {
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
    column.accessor("departmentCode", {
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
    column.accessor("branchId", {
      id: "branchId",
      header: t("form.branch"),
      enableSorting: false,
      meta: {
        filter: {
          field: "branchId",
          valueType: "select",
          ops: SELECT_FILTER_OPS,
          defaultOp: "eq",
          options: branchOptions,
        },
      },
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (branchNames.get(value) ?? "—") : "—"
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
          onEdit={() => void navigate(`/departments/${row.original.id}/edit`)}
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
    <Button type="button" onClick={() => void navigate("/departments/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  )

  function renderBody() {
    if (departmentsQuery.isPending) {
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
        tableId="departments"
        columns={columns}
        data={rows}
        getRowId={(department) => department.id}
        label={t("title")}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={filters}
        onColumnDialogApply={applyColumnDialog}
        onRowClick={(department) => void navigate(`/departments/${department.id}`)}
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
              meta={departmentsQuery.data?.meta}
              isDisabled={departmentsQuery.isPending}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("delete.title", { name: target?.departmentName ?? "" })}
        description={t("delete.description", {
          name: target?.departmentName ?? "",
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
