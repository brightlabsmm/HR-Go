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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import { useDepartmentsQuery } from "@/shared/queries/department.query"
import {
  useDeleteEmployeeMutation,
  useEmployeesQuery,
} from "@/shared/queries/employee.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Employee } from "@/shared/services/employee.service"

const column = createDataTableColumns<Employee>()
const FILTER_KEYS = ["status", "branch", "department", "q"] as const

export function EmployeeListPage() {
  const { t, i18n } = useTranslation("employees")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get("status") ?? undefined
  const branchId = searchParams.get("branch") ?? undefined
  const departmentId = searchParams.get("department") ?? undefined
  const search = searchParams.get("q") ?? undefined

  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const employeesQuery = useEmployeesQuery({
    page,
    limit,
    status,
    branchId,
    departmentId,
    search,
  })

  const branchesQuery = useBranchesQuery({ limit: 100 })
  const departmentsQuery = useDepartmentsQuery({ limit: 100 })
  const deleteMutation = useDeleteEmployeeMutation()

  const [target, setTarget] = useState<Employee | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const rows = employeesQuery.data?.items ?? []
  const total = employeesQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty = employeesQuery.isSuccess && !hasFilters && total === 0

  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const isSomeSelected = rows.some((r) => selectedIds.has(r.id))

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)))
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
    { value: "ACTIVE", label: "Active" },
    { value: "PROBATION", label: "Probation" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "TERMINATED", label: "Terminated" },
    { value: "RESIGNED", label: "Resigned" },
  ]

  const branchItems = [
    { value: "all", label: t("all_branches") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const departmentItems = [
    { value: "all", label: t("all_departments") },
    ...(departmentsQuery.data?.items ?? []).map((d) => ({
      value: d.id,
      label: d.departmentName,
    })),
  ]

  const columns = column.columns([
    column.display({
      id: "select",
      header: () => (
        <div className="flex items-center justify-center pl-1">
          <input
            type="checkbox"
            className="size-4 cursor-pointer rounded border-border accent-primary"
            checked={isAllSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = !isAllSelected && isSomeSelected
              }
            }}
            onChange={toggleSelectAll}
            aria-label="Select all"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { align: "start" },
      cell: ({ row }) => (
        <div
          className="flex items-center justify-center pl-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="size-4 cursor-pointer rounded border-border accent-primary"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelectRow(row.original.id)}
            aria-label={`Select ${row.original.fullName}`}
          />
        </div>
      ),
    }),
    column.accessor("fullName", {
      id: "name",
      header: t("columns.name"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-caption font-semibold">
              {getInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.original.fullName}
            </span>
            {row.original.email && (
              <span className="text-small-2 text-muted-foreground">
                {row.original.email}
              </span>
            )}
          </div>
        </div>
      ),
    }),
    column.accessor("employeeCode", {
      id: "code",
      header: t("columns.code"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-small-2 text-muted-foreground">
          {getValue()}
        </span>
      ),
    }),
    column.accessor("branchName", {
      header: t("columns.branch"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("departmentName", {
      header: t("columns.department"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("positionTitle", {
      header: t("columns.position"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("roleName", {
      header: t("columns.role"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
    column.accessor("employmentStatus", {
      header: t("columns.status"),
      enableSorting: false,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    column.accessor("dateOfJoining", {
      header: t("columns.joined"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue()
        return val ? formatDate(val, i18n.language) : "—"
      },
    }),
    column.display({
      id: "actions",
      header: t("columns.actions"),
      enableSorting: false,
      enableHiding: false,
      meta: { align: "end" },
      cell: ({ row }) => (
        <DataTableActions
          onEdit={() => void navigate(`/employees/${row.original.id}/edit`)}
          onDelete={() => window.setTimeout(() => setTarget(row.original), 0)}
        />
      ),
    }),
  ])

  const addButton = (
    <Button type="button" onClick={() => void navigate("/employees/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  )

  function renderBody() {
    if (employeesQuery.isPending) {
      return <TableSkeleton columns={7} />
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
        tableId="employees"
        columns={columns}
        data={rows}
        getRowId={(employee) => employee.id}
        label={t("title")}
        onRowClick={(employee) => void navigate(`/employees/${employee.id}`)}
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
          <div className="flex flex-col gap-3">
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
              <FilterSelect
                items={departmentItems}
                value={departmentId ?? "all"}
                label={t("all_departments")}
                onValueChange={(val) => patch("department", val)}
                className="w-48"
              />
            </FilterBar>
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs text-foreground">
                <span className="font-medium">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "employee" : "employees"} selected
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear selection
                </Button>
              </div>
            )}
          </div>
        }
        footer={
          isUnfilteredEmpty ? null : (
            <Pagination
              meta={employeesQuery.data?.meta}
              isDisabled={employeesQuery.isPending}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("delete.title", { name: target?.fullName ?? "" })}
        description={t("delete.description", {
          name: target?.fullName ?? "",
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
            onError: () => setTarget(null),
          })
        }}
      />
    </MotionStack>
  )
}
