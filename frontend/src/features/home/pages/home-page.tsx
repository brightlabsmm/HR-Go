import { type ReactNode, useState } from "react"
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarCheckIcon,
  ClockIcon,
  ContactRoundIcon,
  FileTextIcon,
  GitBranchIcon,
  NetworkIcon,
  PlusIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { FilterSelect } from "@/components/common/filter-select"
import { MotionStack } from "@/components/common/motion-stack"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useAttendanceSummaryQuery } from "@/shared/queries/attendance.query"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import { useEmployeeSummaryQuery } from "@/shared/queries/employee.query"
import type { WorkforceCountItem } from "@/shared/services/employee.service"
import { formatLocalDateInput } from "@/util/format-date"

interface BreakdownCardProps {
  title: string
  subtitle?: string
  icon: ReactNode
  items: WorkforceCountItem[]
  total: number
  barColorClass: string
  selectedId?: string
  emptyLabel: string
  formatLabel?: (item: WorkforceCountItem) => string
  onItemClick?: (item: WorkforceCountItem) => void
  headerAction?: ReactNode
}

function BreakdownCard({
  title,
  subtitle,
  icon,
  items,
  total,
  barColorClass,
  selectedId,
  emptyLabel,
  formatLabel,
  onItemClick,
  headerAction,
}: BreakdownCardProps) {
  const { t } = useTranslation("home")

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-hair bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </span>
          <div>
            <h2 className="text-body-2 font-semibold text-foreground">{title}</h2>
            {subtitle ? (
              <p className="text-caption text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {headerAction}
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-small-2 text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const label = formatLabel
              ? formatLabel(item)
              : item.label === "Unassigned"
                ? t("unassigned")
                : item.label
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            const isSelected = Boolean(selectedId && item.id === selectedId)
            const interactive = Boolean(onItemClick && (item.id || item.label))

            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-small-2 font-medium text-foreground">
                      {label}
                    </span>
                    {item.code ? (
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {item.code}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1.5">
                    <span className="text-small-1 font-semibold tabular-nums text-foreground">
                      {item.count}
                    </span>
                    <span className="text-caption tabular-nums text-muted-foreground">
                      ({pct}%)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${barColorClass}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </>
            )

            return (
              <li key={item.id ?? `${item.label}-${idx}`}>
                {interactive ? (
                  <button
                    type="button"
                    onClick={() => onItemClick?.(item)}
                    className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-transparent hover:border-hair hover:bg-subtle/60"
                    }`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1.5 px-2.5 py-1.5">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function HomePage() {
  const { t } = useTranslation("home")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const { can, user } = usePermissions()

  const canReadEmployees = can("org.employee.read")
  const canCreateEmployee = can("org.employee.create")
  const canReadAttendance = can("org.attendance.read")

  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    undefined
  )

  const summaryQuery = useEmployeeSummaryQuery(
    selectedBranchId,
    canReadEmployees
  )
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const todayStr = formatLocalDateInput(new Date())
  const attendanceQuery = useAttendanceSummaryQuery(
    { from: todayStr, to: todayStr, branchId: selectedBranchId },
    canReadAttendance
  )

  if (!canReadEmployees) {
    return (
      <MotionStack className="flex flex-col gap-6">
        <PageHeader
          title={t("fallback.title", { name: user?.fullName || "" })}
          description={t("fallback.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {canReadAttendance && (
            <Link
              to="/attendance"
              className="flex items-center justify-between rounded-xl border border-hair bg-surface p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <CalendarCheckIcon className="size-5 text-primary" />
                <span className="font-medium text-foreground">
                  {t("fallback.attendance")}
                </span>
              </div>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </Link>
          )}
          {can("org.holiday.read") && (
            <Link
              to="/holidays"
              className="flex items-center justify-between rounded-xl border border-hair bg-surface p-5 transition hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <CalendarCheckIcon className="size-5 text-emerald-500" />
                <span className="font-medium text-foreground">
                  {t("fallback.holidays")}
                </span>
              </div>
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </Link>
          )}
          <Link
            to="/account"
            className="flex items-center justify-between rounded-xl border border-hair bg-surface p-5 transition hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <ContactRoundIcon className="size-5 text-primary" />
              <span className="font-medium text-foreground">
                {t("fallback.account")}
              </span>
            </div>
            <ArrowUpRightIcon className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </MotionStack>
    )
  }

  const summary = summaryQuery.data
  const branchTotal = (summary?.byBranch ?? []).reduce(
    (acc, item) => acc + item.count,
    0
  )
  const branchFilterItems = [
    { value: "all", label: t("all_branches") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const employeesLink = selectedBranchId
    ? `/employees?branch=${selectedBranchId}`
    : "/employees"

  const kpiCards = [
    {
      label: t("kpis.total_employees"),
      value: summary?.totalEmployees ?? 0,
      sub: t("kpis.inactive_count", {
        count: summary?.inactiveEmployees ?? 0,
      }),
      icon: <UsersIcon className="size-4 text-primary" />,
      to: employeesLink,
    },
    {
      label: t("kpis.active_employees"),
      value: summary?.activeEmployees ?? 0,
      sub: selectedBranchId
        ? branchFilterItems.find((b) => b.value === selectedBranchId)?.label
        : t("all_branches"),
      icon: <UserCheckIcon className="size-4 text-emerald-500" />,
      to: selectedBranchId
        ? `/employees?branch=${selectedBranchId}&status=ACTIVE`
        : "/employees?status=ACTIVE",
    },
    {
      label: t("kpis.branches"),
      value: summary?.branchCount ?? 0,
      sub: tCommon("nav.branches"),
      icon: <GitBranchIcon className="size-4 text-blue-500" />,
      to: "/branches",
    },
    {
      label: t("kpis.departments"),
      value: summary?.departmentCount ?? 0,
      sub: tCommon("nav.departments"),
      icon: <NetworkIcon className="size-4 text-violet-500" />,
      to: "/departments",
    },
    {
      label: t("kpis.positions"),
      value: summary?.positionCount ?? 0,
      sub: `${summary?.shiftCount ?? 0} ${t("kpis.shifts")}`,
      icon: <BriefcaseIcon className="size-4 text-amber-500" />,
      to: "/positions",
    },
  ]

  return (
    <MotionStack className="flex flex-col gap-6 pb-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              items={branchFilterItems}
              value={selectedBranchId ?? "all"}
              label={t("all_branches")}
              onValueChange={(val) =>
                setSelectedBranchId(!val || val === "all" ? undefined : val)
              }
              className="w-52"
            />
            {canCreateEmployee && (
              <Button
                type="button"
                onClick={() => void navigate("/employees/new")}
              >
                <PlusIcon className="size-4" />
                {t("add_employee")}
              </Button>
            )}
          </div>
        }
      />

      {summaryQuery.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {kpiCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2 text-caption font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {card.icon}
                    {card.label}
                  </span>
                  <ArrowUpRightIcon className="size-3.5 opacity-50" />
                </div>
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {card.value}
                </span>
                {card.sub ? (
                  <span className="truncate text-caption text-muted-foreground">
                    {card.sub}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          {canReadAttendance && attendanceQuery.data && (
            <section className="flex flex-col gap-3 rounded-xl border border-hair bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarCheckIcon className="size-4 text-primary" />
                  <h2 className="text-body-2 font-semibold text-foreground">
                    {t("sections.today_attendance")}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void navigate("/attendance")}
                >
                  {t("attendance.view_attendance")}
                  <ArrowUpRightIcon className="ml-1 size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: t("attendance.present"),
                    value: attendanceQuery.data.presentDays,
                    cls: "text-emerald-600",
                    status: "PRESENT",
                  },
                  {
                    label: t("attendance.late"),
                    value: attendanceQuery.data.lateDays,
                    cls: "text-amber-600",
                    status: "LATE",
                  },
                  {
                    label: t("attendance.absent"),
                    value: attendanceQuery.data.absentDays,
                    cls: "text-rose-600",
                    status: "ABSENT",
                  },
                  {
                    label: t("attendance.half_day"),
                    value: attendanceQuery.data.halfDays,
                    cls: "text-indigo-600",
                    status: "HALF_DAY",
                  },
                ].map((m) => (
                  <Link
                    key={m.status}
                    to={`/attendance?date=${todayStr}&status=${m.status}`}
                    className="flex flex-col rounded-lg border border-hair bg-subtle/40 px-3 py-2.5 transition hover:border-primary/40"
                  >
                    <span className="text-caption text-muted-foreground">
                      {m.label}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${m.cls}`}>
                      {m.value}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard
              title={t("sections.by_branch")}
              subtitle={t("sections.by_branch_hint")}
              icon={<Building2Icon className="size-4" />}
              items={summary?.byBranch ?? []}
              total={branchTotal}
              barColorClass="bg-primary"
              selectedId={selectedBranchId}
              emptyLabel={tCommon("states.no_results_title")}
              onItemClick={(item) => {
                if (!item.id) {
                  void navigate("/employees")
                  return
                }
                setSelectedBranchId((prev) =>
                  prev === item.id ? undefined : (item.id ?? undefined)
                )
              }}
              headerAction={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void navigate(employeesLink)}
                >
                  {t("view_employees")}
                </Button>
              }
            />

            <BreakdownCard
              title={t("sections.by_department")}
              icon={<NetworkIcon className="size-4" />}
              items={summary?.byDepartment ?? []}
              total={summary?.totalEmployees ?? 0}
              barColorClass="bg-violet-500"
              emptyLabel={tCommon("states.no_results_title")}
              onItemClick={(item) => {
                if (item.id) {
                  const params = new URLSearchParams({ department: item.id })
                  if (selectedBranchId) params.set("branch", selectedBranchId)
                  void navigate(`/employees?${params.toString()}`)
                } else {
                  void navigate(employeesLink)
                }
              }}
            />

            <BreakdownCard
              title={t("sections.by_position")}
              icon={<BriefcaseIcon className="size-4" />}
              items={summary?.byPosition ?? []}
              total={summary?.totalEmployees ?? 0}
              barColorClass="bg-amber-500"
              emptyLabel={tCommon("states.no_results_title")}
              onItemClick={(item) => {
                if (item.id) {
                  void navigate(`/positions/${item.id}`)
                } else {
                  void navigate(employeesLink)
                }
              }}
            />

            <BreakdownCard
              title={t("sections.by_shift")}
              icon={<ClockIcon className="size-4" />}
              items={summary?.byShift ?? []}
              total={summary?.totalEmployees ?? 0}
              barColorClass="bg-emerald-500"
              emptyLabel={tCommon("states.no_results_title")}
              onItemClick={() => void navigate("/shifts")}
            />

            <BreakdownCard
              title={t("sections.by_status")}
              icon={<UserCheckIcon className="size-4" />}
              items={summary?.byStatus ?? []}
              total={summary?.totalEmployees ?? 0}
              barColorClass="bg-sky-500"
              emptyLabel={tCommon("states.no_results_title")}
              formatLabel={(item) =>
                t(`status_labels.${item.label}`, { defaultValue: item.label })
              }
              onItemClick={(item) => {
                const params = new URLSearchParams({ status: item.label })
                if (selectedBranchId) params.set("branch", selectedBranchId)
                void navigate(`/employees?${params.toString()}`)
              }}
            />

            <BreakdownCard
              title={t("sections.by_contract")}
              icon={<FileTextIcon className="size-4" />}
              items={summary?.byContractType ?? []}
              total={summary?.totalEmployees ?? 0}
              barColorClass="bg-indigo-500"
              emptyLabel={tCommon("states.no_results_title")}
              formatLabel={(item) =>
                t(`contract_labels.${item.label}`, { defaultValue: item.label })
              }
              onItemClick={() => void navigate(employeesLink)}
            />
          </div>
        </>
      )}
    </MotionStack>
  )
}
