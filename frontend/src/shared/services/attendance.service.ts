import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY"

export type CorrectionRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface AttendanceRecord {
  id: string
  organizationId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  shiftId?: string | null
  shiftName?: string | null
  branchName?: string | null
  departmentName?: string | null
  attendanceDate: string // YYYY-MM-DD
  checkIn?: string | null // RFC3339
  checkOut?: string | null // RFC3339
  attendanceStatus: AttendanceStatus | string
  lateMinutes: number
  earlyLeaveMinutes: number
  workedMinutes: number
  source: string
  remarks?: string | null
  createdAt: string
  updatedAt: string
}

export interface AttendanceSummary {
  from: string
  to: string
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  halfDays: number
  totalWorkedMinutes: number
  totalLateMinutes: number
}

export interface AttendanceCorrection {
  id: string
  organizationId: string
  attendanceId?: string | null
  employeeId: string
  employeeCode: string
  employeeName: string
  attendanceDate: string
  requestedCheckIn?: string | null
  requestedCheckOut?: string | null
  reason: string
  requestStatus: CorrectionRequestStatus | string
  reviewedByAccountId?: string | null
  reviewerName?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface AttendanceListParams extends ListQueryParams {
  employeeId?: string
  branchId?: string
  departmentId?: string
  date?: string
  from?: string
  to?: string
}

export interface AttendanceSummaryParams {
  employeeId?: string
  branchId?: string
  departmentId?: string
  from: string
  to: string
}

export interface CorrectionListParams extends ListQueryParams {
  employeeId?: string
  from?: string
  to?: string
}

export interface CheckInInput {
  employeeId: string
  checkInTime?: string | null
  shiftId?: string | null
  source?: string | null
  remarks?: string | null
}

export interface CheckOutInput {
  employeeId: string
  checkOutTime?: string | null
  remarks?: string | null
}

export interface ManualAttendanceInput {
  employeeId: string
  attendanceDate: string
  shiftId?: string | null
  checkIn?: string | null
  checkOut?: string | null
  attendanceStatus?: AttendanceStatus | string | null
  remarks?: string | null
}

export interface CreateCorrectionInput {
  employeeId: string
  attendanceId?: string | null
  attendanceDate: string
  requestedCheckIn?: string | null
  requestedCheckOut?: string | null
  reason: string
}

export interface ReviewCorrectionInput {
  decision: "APPROVED" | "REJECTED"
  reason?: string | null
}

export function listAttendanceRecords(params?: AttendanceListParams) {
  return unwrapPage<AttendanceRecord>(
    apiClient.get(workspacePath("/attendance/records"), {
      params: toListQuery(params),
    })
  )
}

export function getAttendanceRecord(id: string) {
  return unwrap<AttendanceRecord>(
    apiClient.get(workspacePath(`/attendance/records/${id}`))
  )
}

export function getAttendanceSummary(params: AttendanceSummaryParams) {
  return unwrap<AttendanceSummary>(
    apiClient.get(workspacePath("/attendance/summary"), {
      params: compactParams(params),
    })
  )
}

export function checkInAttendance(input: CheckInInput) {
  return unwrap<AttendanceRecord>(
    apiClient.post(workspacePath("/attendance/check-in"), compactParams(input))
  )
}

export function checkOutAttendance(input: CheckOutInput) {
  return unwrap<AttendanceRecord>(
    apiClient.post(workspacePath("/attendance/check-out"), compactParams(input))
  )
}

export function manualAttendanceEntry(input: ManualAttendanceInput) {
  return unwrap<AttendanceRecord>(
    apiClient.post(workspacePath("/attendance/manual"), compactParams(input))
  )
}

export function listAttendanceCorrections(params?: CorrectionListParams) {
  return unwrapPage<AttendanceCorrection>(
    apiClient.get(workspacePath("/attendance/corrections"), {
      params: toListQuery(params),
    })
  )
}

export function getAttendanceCorrection(id: string) {
  return unwrap<AttendanceCorrection>(
    apiClient.get(workspacePath(`/attendance/corrections/${id}`))
  )
}

export function createAttendanceCorrection(input: CreateCorrectionInput) {
  return unwrap<AttendanceCorrection>(
    apiClient.post(workspacePath("/attendance/corrections"), compactParams(input))
  )
}

export function reviewAttendanceCorrection(id: string, input: ReviewCorrectionInput) {
  return unwrap<AttendanceCorrection>(
    apiClient.post(
      workspacePath(`/attendance/corrections/${id}/review`),
      compactParams(input)
    )
  )
}
