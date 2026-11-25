import { useMemo, useState } from "react"
import {
  AlertCircleIcon,
  CalendarCheckIcon,
  ClockIcon,
  FileEditIcon,
  LogInIcon,
  LogOutIcon,
  PlusIcon,
  UserXIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import {
  createDataTableColumns,
  DataTable,
} from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ATTENDANCE_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT: { bg: "bg-success-muted", text: "text-success", dot: "bg-success" },
  LATE: { bg: "bg-warning-muted", text: "text-warning-foreground", dot: "bg-warning" },
  ABSENT: { bg: "bg-destructive-muted", text: "text-destructive", dot: "bg-destructive" },
  HALF_DAY: { bg: "bg-info-muted", text: "text-info", dot: "bg-info" },
  ON_LEAVE: { bg: "bg-purple-100 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  HOLIDAY: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("attendance")
  const key = (status || "").toUpperCase()
  const style = ATTENDANCE_STATUS_STYLES[key] || {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  }
  const label = t(`status.${key}`, { defaultValue: status })

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-small-2 font-medium",
        style.bg,
        style.text
      )}
    >
      <i className={cn("inline-block size-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  )
}

const CORRECTION_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-warning-muted", text: "text-warning-foreground", dot: "bg-warning" },
  APPROVED: { bg: "bg-success-muted", text: "text-success", dot: "bg-success" },
  REJECTED: { bg: "bg-destructive-muted", text: "text-destructive", dot: "bg-destructive" },
}

function CorrectionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("attendance")
  const key = (status || "").toUpperCase()
  const style = CORRECTION_STATUS_STYLES[key] || {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  }
  const label = t(`correction_status.${key}`, { defaultValue: status })

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-small-2 font-medium",
        style.bg,
        style.text
      )}
    >
      <i className={cn("inline-block size-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  )
}
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useAttendanceCorrectionsQuery,
  useAttendanceRecordsQuery,
  useAttendanceSummaryQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useCreateCorrectionMutation,
  useManualAttendanceMutation,
  useReviewCorrectionMutation,
} from "@/shared/queries/attendance.query"
import { useEmployeesQuery } from "@/shared/queries/employee.query"
import { useShiftsQuery } from "@/shared/queries/shift.query"
import { toast } from "@/shared/stores/toast.store"
import { formatDate } from "@/util/format-date"
import { getInitials } from "@/util/initials"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

import type {
  AttendanceCorrection,
  AttendanceRecord,
} from "@/shared/services/attendance.service"

const recordCol = createDataTableColumns<AttendanceRecord>()
const correctionCol = createDataTableColumns<AttendanceCorrection>()

export function AttendanceListPage() {
  const { t, i18n } = useTranslation("attendance")
  const { t: tCommon } = useTranslation("common")
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<"records" | "corrections">("records")

  // Filters
  const status = searchParams.get("status") ?? undefined
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0]
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const limit = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  // Permissions
  const { can } = usePermissions()
  const canCreate = can("org.attendance.create")
  const canApprove = can("org.attendance.approve")
  const canCorrect = can("org.attendance.correct")

  // Queries
  const recordsQuery = useAttendanceRecordsQuery({
    page,
    limit,
    status,
    date,
  })

  const correctionsQuery = useAttendanceCorrectionsQuery({
    page,
    limit,
    status,
  })

  // Date range for summary (current month)
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0]
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]

  const summaryQuery = useAttendanceSummaryQuery({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  })

  const employeesQuery = useEmployeesQuery({ limit: 100 })
  const shiftsQuery = useShiftsQuery({ limit: 100 })

  // Mutations
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()
  const manualMutation = useManualAttendanceMutation()
  const reviewMutation = useReviewCorrectionMutation()
  const createCorrectionMutation = useCreateCorrectionMutation()

  // Modals state
  const [showPunchDialog, setShowPunchDialog] = useState(false)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<AttendanceCorrection | null>(null)

  // Punch modal state
  const [punchMode, setPunchMode] = useState<"in" | "out">("in")
  const [punchEmployeeId, setPunchEmployeeId] = useState("")
  const [punchShiftId, setPunchShiftId] = useState("")
  const [punchTime, setPunchTime] = useState("")
  const [punchRemarks, setPunchRemarks] = useState("")

  // Manual modal state
  const [manualEmployeeId, setManualEmployeeId] = useState("")
  const [manualDate, setManualDate] = useState(date)
  const [manualShiftId, setManualShiftId] = useState("")
  const [manualCheckIn, setManualCheckIn] = useState("")
  const [manualCheckOut, setManualCheckOut] = useState("")
  const [manualStatus, setManualStatus] = useState("PRESENT")
  const [manualRemarks, setManualRemarks] = useState("")

  // Correction request modal state
  const [corrEmployeeId, setCorrEmployeeId] = useState("")
  const [corrDate, setCorrDate] = useState(date)
  const [corrCheckIn, setCorrCheckIn] = useState("")
  const [corrCheckOut, setCorrCheckOut] = useState("")
  const [corrReason, setCorrReason] = useState("")

  // Review modal state
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED")
  const [reviewReason, setReviewReason] = useState("")

  const employeeItems = useMemo(
    () =>
      (employeesQuery.data?.items ?? []).map((e) => ({
        value: e.id,
        label: `${e.fullName} (${e.employeeCode})`,
      })),
    [employeesQuery.data?.items]
  )

  const shiftItems = useMemo(
    () =>
      (shiftsQuery.data?.items ?? []).map((s) => ({
        value: s.id,
        label: `${s.shiftName} (${s.startTime} - ${s.endTime})`,
      })),
    [shiftsQuery.data?.items]
  )

  const selectedPunchEmp = employeesQuery.data?.items?.find((e) => e.id === punchEmployeeId)
  const selectedPunchShift = shiftsQuery.data?.items?.find((s) => s.id === punchShiftId)
  const selectedManualEmp = employeesQuery.data?.items?.find((e) => e.id === manualEmployeeId)
  const selectedManualShift = shiftsQuery.data?.items?.find((s) => s.id === manualShiftId)
  const selectedCorrEmp = employeesQuery.data?.items?.find((e) => e.id === corrEmployeeId)

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
    next.delete("status")
    next.delete("date")
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  const statusItems = [
    { value: "all", label: "All status" },
    { value: "PRESENT", label: "Present" },
    { value: "LATE", label: "Late" },
    { value: "HALF_DAY", label: "Half Day" },
    { value: "ABSENT", label: "Absent" },
    { value: "ON_LEAVE", label: "On Leave" },
    { value: "HOLIDAY", label: "Holiday" },
  ]

  const correctionStatusItems = [
    { value: "all", label: "All status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ]

  const recordColumns = recordCol.columns([
    recordCol.accessor("employeeName", {
      header: t("columns.employee"),
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.employeeName || row.original.employeeId
        const code = row.original.employeeCode || "—"
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-caption font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {name}
              </span>
              <span className="font-mono text-small-2 text-muted-foreground">
                {code}
              </span>
            </div>
          </div>
        )
      },
    }),
    recordCol.accessor("attendanceDate", {
      header: t("columns.date"),
      enableSorting: false,
      cell: ({ getValue }) => formatDate(getValue(), i18n.language),
    }),
    recordCol.accessor("shiftName", {
      header: t("columns.shift"),
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "Default",
    }),
    recordCol.accessor("checkIn", {
      header: t("columns.check_in"),
      enableSorting: false,
      cell: ({ row }) => {
        const val = row.original.checkIn
        if (!val) return "—"
        const timePart = val.includes("T") ? val.split("T")[1].slice(0, 5) : val
        return (
          <div className="flex items-center gap-1.5 font-mono text-small-2">
            <span>{timePart}</span>
            {row.original.lateMinutes > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                +{row.original.lateMinutes}m late
              </Badge>
            )}
          </div>
        )
      },
    }),
    recordCol.accessor("checkOut", {
      header: t("columns.check_out"),
      enableSorting: false,
      cell: ({ row }) => {
        const val = row.original.checkOut
        if (!val) return "—"
        const timePart = val.includes("T") ? val.split("T")[1].slice(0, 5) : val
        return (
          <div className="flex items-center gap-1.5 font-mono text-small-2">
            <span>{timePart}</span>
            {row.original.earlyLeaveMinutes > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                -{row.original.earlyLeaveMinutes}m early
              </Badge>
            )}
          </div>
        )
      },
    }),
    recordCol.accessor("workedMinutes", {
      header: t("columns.worked"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const mins = getValue()
        if (!mins) return "—"
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return `${h}h ${m}m`
      },
    }),
    recordCol.accessor("attendanceStatus", {
      header: t("columns.status"),
      enableSorting: false,
      cell: ({ getValue }) => <AttendanceStatusBadge status={getValue()} />,
    }),
    recordCol.accessor("source", {
      header: t("columns.source"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-small-2 text-muted-foreground uppercase text-[11px]">
          {getValue()}
        </span>
      ),
    }),
  ])

  const correctionColumns = correctionCol.columns([
    correctionCol.accessor("employeeName", {
      header: t("corrections.columns.employee"),
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.original.employeeName || row.original.employeeId
        const code = row.original.employeeCode || "—"
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {name}
              </span>
              <span className="font-mono text-caption text-muted-foreground">
                {code}
              </span>
            </div>
          </div>
        )
      },
    }),
    correctionCol.accessor("attendanceDate", {
      header: t("corrections.columns.date"),
      enableSorting: false,
      cell: ({ getValue }) => formatDate(getValue(), i18n.language),
    }),
    correctionCol.accessor("requestedCheckIn", {
      header: t("corrections.columns.requested_in"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue()
        return val ? (val.includes("T") ? val.split("T")[1].slice(0, 5) : val) : "—"
      },
    }),
    correctionCol.accessor("requestedCheckOut", {
      header: t("corrections.columns.requested_out"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue()
        return val ? (val.includes("T") ? val.split("T")[1].slice(0, 5) : val) : "—"
      },
    }),
    correctionCol.accessor("reason", {
      header: t("corrections.columns.reason"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-small-2 text-foreground max-w-[200px] truncate block" title={getValue()}>
          {getValue()}
        </span>
      ),
    }),
    correctionCol.accessor("requestStatus", {
      header: t("corrections.columns.status"),
      enableSorting: false,
      cell: ({ getValue }) => <CorrectionStatusBadge status={getValue()} />,
    }),
    correctionCol.display({
      id: "actions",
      header: "Action",
      enableSorting: false,
      meta: { align: "end" },
      cell: ({ row }) => {
        if (row.original.requestStatus !== "PENDING" || !canApprove) {
          return (
            <span className="text-caption text-muted-foreground">
              {row.original.reviewerName || "—"}
            </span>
          )
        }
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setReviewTarget(row.original)
              setReviewDecision("APPROVED")
              setReviewReason("")
            }}
          >
            {t("corrections.review")}
          </Button>
        )
      },
    }),
  ])

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-hair p-0.5 bg-subtle">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "records" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("records")}
          className="h-8 px-2.5"
        >
          {t("tab_records")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === "corrections" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("corrections")}
          className="h-8 px-2.5"
        >
          {t("tab_corrections")}
        </Button>
      </div>

      {canCreate && (
        <>
          <Button
            size="sm"
            onClick={() => {
              setPunchMode("in")
              setPunchEmployeeId("")
              setPunchShiftId("")
              setPunchTime(new Date().toTimeString().slice(0, 5))
              setPunchRemarks("")
              setShowPunchDialog(true)
            }}
          >
            <ClockIcon className="size-4" />
            Quick Punch
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setManualEmployeeId("")
              setManualDate(date)
              setManualShiftId("")
              setManualCheckIn("09:00")
              setManualCheckOut("18:00")
              setManualStatus("PRESENT")
              setManualRemarks("")
              setShowManualDialog(true)
            }}
          >
            <PlusIcon className="size-4" />
            {t("manual_entry")}
          </Button>
        </>
      )}

      {canCorrect && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setCorrEmployeeId("")
            setCorrDate(date)
            setCorrCheckIn("09:00")
            setCorrCheckOut("18:00")
            setCorrReason("")
            setShowCorrectionDialog(true)
          }}
        >
          <FileEditIcon className="size-4" />
          {t("corrections.submit")}
        </Button>
      )}
    </div>
  )

  const summary = summaryQuery.data

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={actionButtons}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
            <CalendarCheckIcon className="size-4 text-emerald-500" />
            {t("metrics.present")}
          </div>
          <span className="text-2xl font-bold text-foreground">
            {summary?.presentDays ?? 0}
          </span>
          <span className="text-caption text-muted-foreground">This month</span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
            <AlertCircleIcon className="size-4 text-amber-500" />
            {t("metrics.late")}
          </div>
          <span className="text-2xl font-bold text-foreground">
            {summary?.lateDays ?? 0}
          </span>
          <span className="text-caption text-muted-foreground">
            {summary?.totalLateMinutes ?? 0} mins total
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
            <UserXIcon className="size-4 text-rose-500" />
            {t("metrics.absent")}
          </div>
          <span className="text-2xl font-bold text-foreground">
            {summary?.absentDays ?? 0}
          </span>
          <span className="text-caption text-muted-foreground">Unexcused</span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
            <ClockIcon className="size-4 text-indigo-500" />
            {t("metrics.half_day")}
          </div>
          <span className="text-2xl font-bold text-foreground">
            {summary?.halfDays ?? 0}
          </span>
          <span className="text-caption text-muted-foreground">Recorded</span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-hair bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
            <ClockIcon className="size-4 text-primary" />
            {t("metrics.total_worked")}
          </div>
          <span className="text-2xl font-bold text-foreground">
            {summary ? Math.floor(summary.totalWorkedMinutes / 60) : 0}h
          </span>
          <span className="text-caption text-muted-foreground">Accumulated</span>
        </div>
      </div>

      <ListCard
        toolbar={
          <FilterBar hasFilters={Boolean(status || date)} onReset={resetFilters}>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter" className="text-small-2 text-muted-foreground">
                Date:
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={date}
                onChange={(e) => patch("date", e.target.value || null)}
                className="h-9 w-40"
              />
            </div>
            <FilterSelect
              items={activeTab === "records" ? statusItems : correctionStatusItems}
              value={status ?? "all"}
              label="All status"
              onValueChange={(val) => patch("status", val)}
              className="w-40"
            />
          </FilterBar>
        }
        footer={
          activeTab === "records" ? (
            <Pagination
              meta={recordsQuery.data?.meta}
              isDisabled={recordsQuery.isPending}
            />
          ) : (
            <Pagination
              meta={correctionsQuery.data?.meta}
              isDisabled={correctionsQuery.isPending}
            />
          )
        }
      >
        {activeTab === "records" ? (
          recordsQuery.isPending ? (
            <TableSkeleton columns={7} />
          ) : (recordsQuery.data?.items ?? []).length === 0 ? (
            <PageEmptyState
              title={t("empty.title")}
              description={t("empty.description")}
            />
          ) : (
            <DataTable
              tableId="attendance-records"
              columns={recordColumns}
              data={recordsQuery.data?.items ?? []}
              getRowId={(rec) => rec.id}
              label={t("title")}
            />
          )
        ) : correctionsQuery.isPending ? (
          <TableSkeleton columns={6} />
        ) : (correctionsQuery.data?.items ?? []).length === 0 ? (
          <PageEmptyState
            title="No correction requests"
            description="Pending time-clock adjustment requests will appear here for review."
          />
        ) : (
          <DataTable
            tableId="attendance-corrections"
            columns={correctionColumns}
            data={correctionsQuery.data?.items ?? []}
            getRowId={(c) => c.id}
            label={t("corrections.title")}
          />
        )}
      </ListCard>

      {/* Quick Punch Dialog */}
      <Dialog open={showPunchDialog} onOpenChange={setShowPunchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Attendance Punch</DialogTitle>
            <DialogDescription>
              Record an employee check-in or check-out timestamp.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <RadioGroup
              value={punchMode}
              onValueChange={(v) => setPunchMode(v as "in" | "out")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="in" id="punch-in" />
                <Label htmlFor="punch-in" className="flex items-center gap-1.5 cursor-pointer">
                  <LogInIcon className="size-4 text-emerald-500" /> Check In
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="out" id="punch-out" />
                <Label htmlFor="punch-out" className="flex items-center gap-1.5 cursor-pointer">
                  <LogOutIcon className="size-4 text-rose-500" /> Check Out
                </Label>
              </div>
            </RadioGroup>

            <div>
              <Label htmlFor="punch-emp">{t("form.employee")}</Label>
              <Select
                items={employeeItems}
                value={punchEmployeeId}
                onValueChange={(val) => setPunchEmployeeId(val ?? "")}
              >
                <SelectTrigger id="punch-emp" className="mt-1 w-full">
                  <SelectValue placeholder="Select employee">
                    {selectedPunchEmp
                      ? `${selectedPunchEmp.fullName} (${selectedPunchEmp.employeeCode})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeItems.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {punchMode === "in" && (
              <div>
                <Label htmlFor="punch-shift">{t("form.shift")}</Label>
                <Select
                  items={shiftItems}
                  value={punchShiftId}
                  onValueChange={(val) => setPunchShiftId(val ?? "")}
                >
                  <SelectTrigger id="punch-shift" className="mt-1 w-full">
                    <SelectValue placeholder="Default assigned shift">
                      {selectedPunchShift
                        ? `${selectedPunchShift.shiftName} (${selectedPunchShift.startTime} - ${selectedPunchShift.endTime})`
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {shiftItems.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="punch-time">Time</Label>
              <Input
                id="punch-time"
                type="time"
                className="mt-1"
                value={punchTime}
                onChange={(e) => setPunchTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="punch-remarks">{t("form.remarks")}</Label>
              <Input
                id="punch-remarks"
                className="mt-1"
                placeholder="Optional punch note..."
                value={punchRemarks}
                onChange={(e) => setPunchRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPunchDialog(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button
              disabled={!punchEmployeeId}
              loading={checkInMutation.isPending || checkOutMutation.isPending}
              onClick={() => {
                const now = new Date()
                const [h, m] = punchTime ? punchTime.split(":") : [now.getHours(), now.getMinutes()]
                const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(h), Number(m))
                const isoTime = dt.toISOString()

                if (punchMode === "in") {
                  checkInMutation.mutate(
                    {
                      employeeId: punchEmployeeId,
                      checkInTime: isoTime,
                      shiftId: punchShiftId || null,
                      source: "WEB_PORTAL",
                      remarks: punchRemarks.trim() || null,
                    },
                    {
                      onSuccess: () => {
                        setShowPunchDialog(false)
                        toast.success("Checked in successfully")
                      },
                    }
                  )
                } else {
                  checkOutMutation.mutate(
                    {
                      employeeId: punchEmployeeId,
                      checkOutTime: isoTime,
                      remarks: punchRemarks.trim() || null,
                    },
                    {
                      onSuccess: () => {
                        setShowPunchDialog(false)
                        toast.success("Checked out successfully")
                      },
                    }
                  )
                }
              }}
            >
              {punchMode === "in" ? t("check_in") : t("check_out")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("manual_entry")}</DialogTitle>
            <DialogDescription>
              Create or override an attendance log for any day.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label htmlFor="man-emp">{t("form.employee")}</Label>
              <Select
                items={employeeItems}
                value={manualEmployeeId}
                onValueChange={(val) => setManualEmployeeId(val ?? "")}
              >
                <SelectTrigger id="man-emp" className="mt-1 w-full">
                  <SelectValue placeholder="Select employee">
                    {selectedManualEmp
                      ? `${selectedManualEmp.fullName} (${selectedManualEmp.employeeCode})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeItems.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="man-date">{t("form.date")}</Label>
                <Input
                  id="man-date"
                  type="date"
                  className="mt-1"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="man-status">{t("form.status")}</Label>
                <Select
                  value={manualStatus}
                  onValueChange={(val) => setManualStatus(val ?? "PRESENT")}
                >
                  <SelectTrigger id="man-status" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="man-in">{t("form.check_in")}</Label>
                <Input
                  id="man-in"
                  type="time"
                  className="mt-1"
                  value={manualCheckIn}
                  onChange={(e) => setManualCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="man-out">{t("form.check_out")}</Label>
                <Input
                  id="man-out"
                  type="time"
                  className="mt-1"
                  value={manualCheckOut}
                  onChange={(e) => setManualCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="man-shift">{t("form.shift")}</Label>
              <Select
                items={shiftItems}
                value={manualShiftId}
                onValueChange={(val) => setManualShiftId(val ?? "")}
              >
                <SelectTrigger id="man-shift" className="mt-1 w-full">
                  <SelectValue placeholder="Default assigned shift">
                    {selectedManualShift
                      ? `${selectedManualShift.shiftName} (${selectedManualShift.startTime} - ${selectedManualShift.endTime})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {shiftItems.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="man-remarks">{t("form.remarks")}</Label>
              <Textarea
                id="man-remarks"
                className="mt-1"
                placeholder="Reason or notes..."
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button
              disabled={!manualEmployeeId || !manualDate}
              loading={manualMutation.isPending}
              onClick={() => {
                let inIso: string | null = null
                let outIso: string | null = null

                if (manualCheckIn) {
                  inIso = `${manualDate}T${manualCheckIn}:00Z`
                }
                if (manualCheckOut) {
                  outIso = `${manualDate}T${manualCheckOut}:00Z`
                }

                manualMutation.mutate(
                  {
                    employeeId: manualEmployeeId,
                    attendanceDate: manualDate,
                    shiftId: manualShiftId || null,
                    checkIn: inIso,
                    checkOut: outIso,
                    attendanceStatus: manualStatus,
                    remarks: manualRemarks.trim() || null,
                  },
                  {
                    onSuccess: () => {
                      setShowManualDialog(false)
                      toast.success(t("form.save"))
                    },
                  }
                )
              }}
            >
              {t("form.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Correction Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("corrections.submit")}</DialogTitle>
            <DialogDescription>
              Submit an attendance time adjustment request for manager review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label htmlFor="corr-emp">{t("form.employee")}</Label>
              <Select
                items={employeeItems}
                value={corrEmployeeId}
                onValueChange={(val) => setCorrEmployeeId(val ?? "")}
              >
                <SelectTrigger id="corr-emp" className="mt-1 w-full">
                  <SelectValue placeholder="Select employee">
                    {selectedCorrEmp
                      ? `${selectedCorrEmp.fullName} (${selectedCorrEmp.employeeCode})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employeeItems.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="corr-date">{t("form.date")}</Label>
              <Input
                id="corr-date"
                type="date"
                className="mt-1"
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="corr-in">{t("form.check_in")}</Label>
                <Input
                  id="corr-in"
                  type="time"
                  className="mt-1"
                  value={corrCheckIn}
                  onChange={(e) => setCorrCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="corr-out">{t("form.check_out")}</Label>
                <Input
                  id="corr-out"
                  type="time"
                  className="mt-1"
                  value={corrCheckOut}
                  onChange={(e) => setCorrCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="corr-reason">Reason for correction</Label>
              <Textarea
                id="corr-reason"
                className="mt-1"
                placeholder="Explain why this time punch requires adjustment..."
                value={corrReason}
                onChange={(e) => setCorrReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button
              disabled={!corrEmployeeId || !corrDate || !corrReason.trim()}
              loading={createCorrectionMutation.isPending}
              onClick={() => {
                let inIso: string | null = null
                let outIso: string | null = null

                if (corrCheckIn) {
                  inIso = `${corrDate}T${corrCheckIn}:00Z`
                }
                if (corrCheckOut) {
                  outIso = `${corrDate}T${corrCheckOut}:00Z`
                }

                createCorrectionMutation.mutate(
                  {
                    employeeId: corrEmployeeId,
                    attendanceDate: corrDate,
                    requestedCheckIn: inIso,
                    requestedCheckOut: outIso,
                    reason: corrReason.trim(),
                  },
                  {
                    onSuccess: () => {
                      setShowCorrectionDialog(false)
                      toast.success("Correction submitted for review")
                      setActiveTab("corrections")
                    },
                  }
                )
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Correction Request Dialog */}
      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("corrections.review")}</DialogTitle>
            <DialogDescription>
              Review adjustment requested by {reviewTarget?.employeeName} for{" "}
              {reviewTarget?.attendanceDate}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-md border border-hair p-3 bg-subtle/50 text-small-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Requested Check-in:</span>{" "}
                  <span className="font-mono font-medium">
                    {reviewTarget?.requestedCheckIn
                      ? reviewTarget.requestedCheckIn.split("T")[1]?.slice(0, 5)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested Check-out:</span>{" "}
                  <span className="font-mono font-medium">
                    {reviewTarget?.requestedCheckOut
                      ? reviewTarget.requestedCheckOut.split("T")[1]?.slice(0, 5)
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-muted-foreground">
                <span className="font-medium text-foreground">Reason:</span>{" "}
                {reviewTarget?.reason}
              </div>
            </div>

            <div>
              <Label>{t("corrections.decision")}</Label>
              <RadioGroup
                value={reviewDecision}
                onValueChange={(v) =>
                  setReviewDecision(v as "APPROVED" | "REJECTED")
                }
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="APPROVED" id="dec-app" />
                  <Label htmlFor="dec-app" className="cursor-pointer text-emerald-600 font-medium">
                    Approve Request
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="REJECTED" id="dec-rej" />
                  <Label htmlFor="dec-rej" className="cursor-pointer text-rose-600 font-medium">
                    Reject Request
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="rev-notes">Review Remarks / Reason</Label>
              <Input
                id="rev-notes"
                className="mt-1"
                placeholder={
                  reviewDecision === "REJECTED"
                    ? "Explanation for rejection..."
                    : "Optional approval note..."
                }
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button
              loading={reviewMutation.isPending}
              variant={reviewDecision === "REJECTED" ? "destructive" : "default"}
              onClick={() => {
                if (!reviewTarget) return
                reviewMutation.mutate(
                  {
                    id: reviewTarget.id,
                    input: {
                      decision: reviewDecision,
                      reason: reviewReason.trim() || null,
                    },
                  },
                  {
                    onSuccess: () => {
                      setReviewTarget(null)
                      toast.success(
                        reviewDecision === "APPROVED"
                          ? "Correction approved and applied"
                          : "Correction rejected"
                      )
                    },
                  }
                )
              }}
            >
              Confirm {reviewDecision === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
