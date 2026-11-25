import { useState } from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon, PlusIcon } from "lucide-react"
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
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { notifyApiError } from "@/app/api/feedback"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeleteHolidayMutation,
  useHolidayCalendarQuery,
  useHolidaysQuery,
} from "@/shared/queries/holiday.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDate, formatLocalDateInput } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type { Holiday } from "@/shared/services/holiday.service"

const column = createDataTableColumns<Holiday>()
const FILTER_KEYS = ["type", "branch", "q"] as const

export function HolidayListPage() {
  const { t, i18n } = useTranslation("holidays")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const canCreate = can("org.holiday.create")
  const canUpdate = can("org.holiday.update")
  const canDelete = can("org.holiday.delete")

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1)

  const holidayType = searchParams.get("type") ?? undefined
  const branchId = searchParams.get("branch") ?? undefined
  const search = searchParams.get("q") ?? undefined

  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key))
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const holidaysQuery = useHolidaysQuery({
    page,
    limit,
    holidayType,
    branchId,
    search,
    year: viewMode === "calendar" ? currentYear : undefined,
  })

  const calendarQuery = useHolidayCalendarQuery({
    year: currentYear,
    month: currentMonth,
    branchId: branchId || undefined,
  })

  const branchesQuery = useBranchesQuery({ limit: 100 })
  const deleteMutation = useDeleteHolidayMutation()

  const [target, setTarget] = useState<Holiday | null>(null)
  const rows = holidaysQuery.data?.items ?? []
  const total = holidaysQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty = holidaysQuery.isSuccess && !hasFilters && total === 0

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

  const typeItems = [
    { value: "all", label: t("all_types") },
    { value: "PUBLIC", label: t("types.PUBLIC") },
    { value: "COMPANY", label: t("types.COMPANY") },
    { value: "OPTIONAL", label: t("types.OPTIONAL") },
  ]

  const branchItems = [
    { value: "all", label: t("all_branches") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const columns = column.columns([
    column.accessor("holidayName", {
      header: t("columns.name"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">{getValue()}</span>
      ),
    }),
    column.accessor("startDate", {
      header: t("columns.dates"),
      enableSorting: false,
      cell: ({ row }) => {
        const start = formatDate(row.original.startDate, i18n.language)
        const end = formatDate(row.original.endDate, i18n.language)
        return (
          <span className="text-small-2 text-muted-foreground">
            {row.original.startDate === row.original.endDate
              ? start
              : `${start} - ${end}`}
          </span>
        )
      },
    }),
    column.accessor("holidayType", {
      header: t("columns.type"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const type = getValue()
        const variant =
          type === "PUBLIC"
            ? "default"
            : type === "COMPANY"
              ? "secondary"
              : "outline"
        return (
          <Badge variant={variant}>
            {t(`types.${type}`, { defaultValue: type })}
          </Badge>
        )
      },
    }),
    column.accessor("isPaid", {
      header: t("columns.paid"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"}>
          {getValue() ? t("paid_yes") : t("paid_no")}
        </Badge>
      ),
    }),
    column.accessor("branchName", {
      header: t("columns.branch"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || t("all_branches_label"),
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
                    ? () => void navigate(`/holidays/${row.original.id}/edit`)
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

  const createHolidayButton = canCreate ? (
    <Button type="button" onClick={() => void navigate("/holidays/new")}>
      <PlusIcon className="size-4" />
      {t("add")}
    </Button>
  ) : null

  const headerActions = (
    <div className="flex items-center gap-3">
      <div className="flex rounded-lg border border-hair p-0.5 bg-subtle">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "table" ? "secondary" : "ghost"}
          onClick={() => setViewMode("table")}
          className="h-8 px-2.5"
        >
          <ListIcon className="size-4 mr-1.5" />
          {t("tab_table")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "calendar" ? "secondary" : "ghost"}
          onClick={() => setViewMode("calendar")}
          className="h-8 px-2.5"
        >
          <CalendarIcon className="size-4 mr-1.5" />
          {t("tab_calendar")}
        </Button>
      </div>
      {createHolidayButton}
    </div>
  )

  function renderCalendarView() {
    const locale = i18n.language || "en"
    const monthTitle = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(currentYear, currentMonth - 1, 1))
    const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
        new Date(2024, 0, 7 + i)
      )
    )
    const todayStr = formatLocalDateInput(new Date())
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay()
    const calendarHolidays = calendarQuery.data?.holidays ?? []

    const prevMonth = () => {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear((y) => y - 1)
      } else {
        setCurrentMonth((m) => m - 1)
      }
    }

    const nextMonth = () => {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear((y) => y + 1)
      } else {
        setCurrentMonth((m) => m + 1)
      }
    }

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-body-1 font-semibold text-foreground">
              {monthTitle}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={prevMonth}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={nextMonth}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const now = new Date()
              setCurrentYear(now.getFullYear())
              setCurrentMonth(now.getMonth() + 1)
            }}
          >
            {t("today")}
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px rounded-lg border border-hair bg-hair overflow-hidden">
          {weekdayLabels.map((day, idx) => (
            <div
              key={idx}
              className="bg-subtle p-2 text-center text-caption font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Empty cells before start of month */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[100px] bg-surface/50 p-2" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1
            const monthStr = String(currentMonth).padStart(2, "0")
            const dayStr = String(dayNum).padStart(2, "0")
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`

            const dayHolidays = calendarHolidays.filter(
              (h) => dateStr >= h.startDate && dateStr <= h.endDate
            )

            const isToday = todayStr === dateStr

            return (
              <div
                key={dateStr}
                className={`min-h-[100px] bg-surface p-2 flex flex-col gap-1 transition-colors hover:bg-subtle/40 ${
                  isToday ? "bg-accent/10" : ""
                }`}
              >
                <span
                  className={`text-small-2 font-medium ${
                    isToday
                      ? "inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {dayNum}
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  {dayHolidays.map((h) => (
                    <div
                      key={h.id}
                      onClick={
                        canUpdate
                          ? () => void navigate(`/holidays/${h.id}/edit`)
                          : undefined
                      }
                      className={`rounded bg-primary/10 px-1.5 py-0.5 text-caption font-medium text-primary truncate ${
                        canUpdate ? "cursor-pointer hover:bg-primary/20" : ""
                      }`}
                      title={`${h.holidayName} (${t(`types.${h.holidayType}`, { defaultValue: h.holidayType })})`}
                    >
                      {h.holidayName}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderBody() {
    if (viewMode === "calendar") {
      return renderCalendarView()
    }

    if (holidaysQuery.isPending) {
      return <TableSkeleton columns={6} />
    }

    if (isUnfilteredEmpty) {
      return (
        <PageEmptyState
          title={t("empty.title")}
          description={t("empty.description")}
          action={createHolidayButton}
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
        tableId="holidays"
        columns={columns}
        data={rows}
        getRowId={(holiday) => holiday.id}
        label={t("title")}
        onRowClick={
          canUpdate ? (holiday) => void navigate(`/holidays/${holiday.id}/edit`) : undefined
        }
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={headerActions}
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
              items={typeItems}
              value={holidayType ?? "all"}
              label={t("all_types")}
              onValueChange={(val) => patch("type", val)}
              className="w-44"
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
          viewMode === "calendar" || isUnfilteredEmpty ? null : (
            <Pagination
              meta={holidaysQuery.data?.meta}
              isDisabled={holidaysQuery.isPending}
            />
          )
        }
      >
        {renderBody()}
      </ListCard>
      <ConfirmDialog
        open={target !== null}
        title={t("delete.title", { name: target?.holidayName ?? "" })}
        description={t("delete.description", {
          name: target?.holidayName ?? "",
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
