import { useMemo, useState } from "react"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"

import { notifyApiError } from "@/app/api/feedback"
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
import { type BadgeTone, ToneBadge } from "@/components/common/tone-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  useDeleteHolidayMutation,
  useHolidayCalendarQuery,
  useHolidaysQuery,
} from "@/shared/queries/holiday.query"
import type {
  CalendarHolidayItem,
  Holiday,
} from "@/shared/services/holiday.service"
import { toast } from "@/shared/stores/toast.store"
import { formatDate, formatLocalDateInput } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

const column = createDataTableColumns<Holiday>()
const FILTER_KEYS = ["type", "branch", "q"] as const

function holidayTypeTone(type: string): BadgeTone {
  switch (type.toUpperCase()) {
    case "PUBLIC":
      return "brand"
    case "COMPANY":
      return "success"
    case "OPTIONAL":
      return "warning"
    default:
      return "neutral"
  }
}

function holidayTypePillClass(type: string) {
  switch (type.toUpperCase()) {
    case "PUBLIC":
      return "bg-primary/12 text-primary"
    case "COMPANY":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
    case "OPTIONAL":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function formatMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`
}

function parseMonthValue(raw: string | null) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number)
    if (m >= 1 && m <= 12) {
      return { year: y, month: m }
    }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function formatRange(startDate: string, endDate: string, locale: string) {
  const start = formatDate(startDate, locale)
  if (startDate === endDate) return start
  return `${start} – ${formatDate(endDate, locale)}`
}

export function HolidayListPage() {
  const { t, i18n } = useTranslation("holidays")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const canCreate = can("org.holiday.create")
  const canUpdate = can("org.holiday.update")
  const canDelete = can("org.holiday.delete")

  const viewMode =
    searchParams.get("view") === "calendar" ? "calendar" : "table"
  const { year: currentYear, month: currentMonth } = parseMonthValue(
    searchParams.get("month")
  )
  const monthValue = formatMonthValue(currentYear, currentMonth)

  const todayStr = formatLocalDateInput(new Date())
  const defaultSelectedForMonth = todayStr.startsWith(monthValue)
    ? todayStr
    : `${monthValue}-01`
  const [selectedDateState, setSelectedDateState] = useState<string>(
    defaultSelectedForMonth
  )
  const selectedDate = selectedDateState.startsWith(monthValue)
    ? selectedDateState
    : defaultSelectedForMonth

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

  const [target, setTarget] = useState<Pick<
    Holiday,
    "id" | "holidayName"
  > | null>(null)
  const rows = holidaysQuery.data?.items ?? []
  const total = holidaysQuery.data?.meta.totalItems ?? 0
  const isUnfilteredEmpty =
    viewMode === "table" &&
    holidaysQuery.isSuccess &&
    !hasFilters &&
    total === 0

  const filteredCalendarHolidays = useMemo(() => {
    const raw = calendarQuery.data?.holidays ?? []
    const needle = search?.trim().toLowerCase() ?? ""
    return raw.filter((h) => {
      if (holidayType && h.holidayType.toUpperCase() !== holidayType) {
        return false
      }
      if (needle) {
        const nameMatch = h.holidayName.toLowerCase().includes(needle)
        const branchMatch = (h.branchName ?? "")
          .toLowerCase()
          .includes(needle)
        if (!nameMatch && !branchMatch) return false
      }
      return true
    })
  }, [calendarQuery.data?.holidays, holidayType, search])

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

  function setView(mode: "table" | "calendar") {
    const next = new URLSearchParams(searchParams)
    if (mode === "calendar") {
      next.set("view", "calendar")
    } else {
      next.delete("view")
    }
    setSearchParams(next)
  }

  function setMonth(nextYear: number, nextMonth: number) {
    const value = formatMonthValue(nextYear, nextMonth)
    const next = new URLSearchParams(searchParams)
    next.set("month", value)
    setSearchParams(next)
    setSelectedDateState(
      todayStr.startsWith(value) ? todayStr : `${value}-01`
    )
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
      cell: ({ row }) => (
        <span className="text-small-2 text-muted-foreground">
          {formatRange(
            row.original.startDate,
            row.original.endDate,
            i18n.language
          )}
        </span>
      ),
    }),
    column.accessor("holidayType", {
      header: t("columns.type"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const type = getValue()
        return (
          <ToneBadge tone={holidayTypeTone(type)} dot>
            {t(`types.${type}`, { defaultValue: type })}
          </ToneBadge>
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
      <div className="flex rounded-lg border border-hair bg-subtle p-0.5">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "table" ? "secondary" : "ghost"}
          onClick={() => setView("table")}
          className="h-8 px-2.5"
        >
          <ListIcon className="mr-1.5 size-4" />
          {t("tab_table")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "calendar" ? "secondary" : "ghost"}
          onClick={() => setView("calendar")}
          className="h-8 px-2.5"
        >
          <CalendarIcon className="mr-1.5 size-4" />
          {t("tab_calendar")}
        </Button>
      </div>
      {createHolidayButton}
    </div>
  )

  function renderAgendaCard(h: CalendarHolidayItem) {
    return (
      <div
        key={h.id}
        className="flex flex-col gap-1.5 rounded-lg border border-hair bg-subtle/40 p-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-small-1 font-semibold text-foreground break-words">
              {h.holidayName}
            </p>
            <p className="text-caption text-muted-foreground">
              {formatRange(h.startDate, h.endDate, i18n.language)}
            </p>
          </div>
          {(canUpdate || canDelete) && (
            <div className="flex shrink-0 items-center gap-0.5">
              {canUpdate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={tCommon("actions.edit")}
                  onClick={() => void navigate(`/holidays/${h.id}/edit`)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={tCommon("actions.delete")}
                  onClick={() => setTarget(h)}
                >
                  <Trash2Icon className="size-3.5 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ToneBadge tone={holidayTypeTone(h.holidayType)} dot>
            {t(`types.${h.holidayType}`, { defaultValue: h.holidayType })}
          </ToneBadge>
          <Badge variant={h.isPaid ? "secondary" : "outline"}>
            {h.isPaid ? t("paid_yes") : t("paid_no")}
          </Badge>
          <Badge variant="outline">
            {h.branchName || t("all_branches_label")}
          </Badge>
        </div>
      </div>
    )
  }

  function renderCalendarView() {
    const locale = i18n.language || "en"
    const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
        new Date(2024, 0, 7 + i)
      )
    )
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay()
    const trailingCells = (7 - ((firstDayIndex + daysInMonth) % 7)) % 7

    const prevMonth = () => {
      if (currentMonth === 1) {
        setMonth(currentYear - 1, 12)
      } else {
        setMonth(currentYear, currentMonth - 1)
      }
    }

    const nextMonth = () => {
      if (currentMonth === 12) {
        setMonth(currentYear + 1, 1)
      } else {
        setMonth(currentYear, currentMonth + 1)
      }
    }

    const selectedDayHolidays = filteredCalendarHolidays.filter(
      (h) => selectedDate >= h.startDate && selectedDate <= h.endDate
    )

    return (
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Left: Compact Month Grid */}
        <div className="flex flex-col gap-3 rounded-xl border border-hair bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Input
                type="month"
                value={monthValue}
                onChange={(e) => {
                  if (!e.target.value) return
                  const { year, month } = parseMonthValue(e.target.value)
                  setMonth(year, month)
                }}
                className="h-8 w-40 text-small-2 font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const now = new Date()
                  setMonth(now.getFullYear(), now.getMonth() + 1)
                }}
              >
                {t("today")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {t("types.PUBLIC")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t("types.COMPANY")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                {t("types.OPTIONAL")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-hair bg-hair">
            {weekdayLabels.map((day, idx) => (
              <div
                key={idx}
                className={`bg-subtle px-2 py-1.5 text-center text-caption font-semibold ${
                  idx === 0 || idx === 6
                    ? "text-muted-foreground/75"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-start-${idx}`}
                className="min-h-[58px] bg-subtle/35 p-1.5"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const dateStr = `${monthValue}-${String(dayNum).padStart(2, "0")}`
              const dayOfWeek = (firstDayIndex + idx) % 7
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const isToday = todayStr === dateStr
              const isSelected = selectedDate === dateStr
              const dayHolidays = filteredCalendarHolidays.filter(
                (h) => dateStr >= h.startDate && dateStr <= h.endDate
              )
              const firstHoliday = dayHolidays[0]
              const extraCount = dayHolidays.length - 1

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateState(dateStr)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[58px] cursor-pointer flex-col items-stretch gap-1 p-1.5 text-left transition-colors hover:bg-accent/30 ${
                    isSelected
                      ? "bg-primary/5 ring-2 ring-inset ring-primary"
                      : isWeekend
                        ? "bg-subtle/45"
                        : "bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex size-5 items-center justify-center rounded-full text-caption font-medium ${
                        isToday
                          ? "bg-primary font-bold text-primary-foreground"
                          : isSelected
                            ? "font-semibold text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {extraCount > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        +{extraCount}
                      </span>
                    )}
                  </div>

                  {firstHoliday ? (
                    <span
                      className={`truncate rounded px-1 py-0.5 text-[11px] font-medium leading-tight ${holidayTypePillClass(
                        firstHoliday.holidayType
                      )}`}
                      title={dayHolidays.map((h) => h.holidayName).join(", ")}
                    >
                      {firstHoliday.holidayName}
                    </span>
                  ) : null}
                </button>
              )
            })}

            {Array.from({ length: trailingCells }).map((_, idx) => (
              <div
                key={`empty-end-${idx}`}
                className="min-h-[58px] bg-subtle/35 p-1.5"
              />
            ))}
          </div>
        </div>

        {/* Right: Selected Day + Full Month Holiday Agenda */}
        <aside className="flex flex-col gap-4 rounded-xl border border-hair bg-surface p-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-body-2 font-semibold text-foreground">
                {formatDate(selectedDate, locale)}
              </h3>
              {canCreate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-caption"
                  onClick={() =>
                    void navigate(`/holidays/new?date=${selectedDate}`)
                  }
                >
                  <PlusIcon className="mr-1 size-3.5" />
                  {t("calendar.add_on_day")}
                </Button>
              )}
            </div>

            {selectedDayHolidays.length === 0 ? (
              <p className="rounded-lg border border-dashed border-hair px-3 py-2.5 text-small-2 text-muted-foreground">
                {t("calendar.no_holidays_day")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayHolidays.map(renderAgendaCard)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-hair pt-3">
            <h4 className="text-small-2 font-semibold text-foreground">
              {t("calendar.month_holidays", {
                count: filteredCalendarHolidays.length,
              })}
            </h4>

            {filteredCalendarHolidays.length === 0 ? (
              <p className="text-small-2 text-muted-foreground">
                {t("calendar.no_holidays_month")}
              </p>
            ) : (
              <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                {filteredCalendarHolidays.map((h) => {
                  const targetDate = h.startDate.startsWith(monthValue)
                    ? h.startDate
                    : `${monthValue}-01`
                  const isActiveDay =
                    selectedDate >= h.startDate && selectedDate <= h.endDate
                  return (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDateState(targetDate)}
                        className={`flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                          isActiveDay
                            ? "border-primary/50 bg-primary/5"
                            : "border-hair hover:bg-subtle/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-small-2 font-medium text-foreground break-words">
                            {h.holidayName}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {formatRange(h.startDate, h.endDate, locale)}
                            {h.branchName ? ` · ${h.branchName}` : ""}
                          </p>
                        </div>
                        <ToneBadge
                          tone={holidayTypeTone(h.holidayType)}
                          className="shrink-0"
                        >
                          {t(`types.${h.holidayType}`, {
                            defaultValue: h.holidayType,
                          })}
                        </ToneBadge>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
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
          canUpdate
            ? (holiday) => void navigate(`/holidays/${holiday.id}/edit`)
            : undefined
        }
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-6">
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
