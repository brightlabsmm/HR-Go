import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

export type ShiftStatus = "ACTIVE" | "INACTIVE"

export interface Shift {
  id: string
  organizationId: string
  branchId?: string | null
  branchName?: string | null
  shiftName: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  breakMinutes: number
  status: ShiftStatus | string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ShiftAssignment {
  id: string
  organizationId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  shiftId: string
  shiftName: string
  startTime: string
  endTime: string
  effectiveFrom: string // YYYY-MM-DD
  effectiveTo?: string | null // YYYY-MM-DD
  status: string
  createdAt: string
  updatedAt: string
}

export interface ShiftAssignmentHistory {
  id: string
  assignmentId?: string | null
  employeeId: string
  oldShiftId?: string | null
  oldShiftName?: string | null
  newShiftId?: string | null
  newShiftName?: string | null
  oldEffectiveFrom?: string | null
  oldEffectiveTo?: string | null
  newEffectiveFrom?: string | null
  newEffectiveTo?: string | null
  changedAt: string
  reason?: string | null
}

export interface ShiftListParams extends ListQueryParams {
  branchId?: string
}

export interface CreateShiftInput {
  shiftName: string
  startTime: string
  endTime: string
  breakMinutes?: number
  branchId?: string | null
  isDefault?: boolean
}

export interface UpdateShiftInput {
  shiftName?: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  branchId?: string | null
  status?: ShiftStatus | string
  isDefault?: boolean
}

export interface AssignShiftInput {
  employeeId: string
  shiftId: string
  effectiveFrom: string
  effectiveTo?: string | null
  reason?: string | null
}

export interface ShiftAssignmentListParams extends ListQueryParams {
  employeeId?: string
  shiftId?: string
}

export function listShifts(params?: ShiftListParams) {
  return unwrapPage<Shift>(
    apiClient.get(workspacePath("/shifts"), {
      params: toListQuery(params),
    })
  )
}

export function getShift(id: string) {
  return unwrap<Shift>(
    apiClient.get(workspacePath(`/shifts/${id}`))
  )
}

export function createShift(input: CreateShiftInput) {
  return unwrap<Shift>(
    apiClient.post(workspacePath("/shifts"), compactParams(input))
  )
}

export function updateShift(id: string, input: UpdateShiftInput) {
  return unwrap<Shift>(
    apiClient.put(workspacePath(`/shifts/${id}`), compactParams(input))
  )
}

export function deleteShift(id: string) {
  return unwrapEmpty(
    apiClient.delete(workspacePath(`/shifts/${id}`))
  )
}

export function listShiftAssignments(params?: ShiftAssignmentListParams) {
  return unwrapPage<ShiftAssignment>(
    apiClient.get(workspacePath("/shift-assignments"), {
      params: toListQuery(params),
    })
  )
}

export function assignShift(input: AssignShiftInput) {
  return unwrap<ShiftAssignment>(
    apiClient.post(workspacePath("/shift-assignments"), compactParams(input))
  )
}

export function getShiftAssignment(id: string) {
  return unwrap<ShiftAssignment>(
    apiClient.get(workspacePath(`/shift-assignments/${id}`))
  )
}

export function listEmployeeShiftAssignments(employeeId: string) {
  return unwrap<ShiftAssignment[]>(
    apiClient.get(workspacePath(`/employees/${employeeId}/shift-assignments`))
  )
}

export function listEmployeeShiftAssignmentHistory(employeeId: string) {
  return unwrap<ShiftAssignmentHistory[]>(
    apiClient.get(workspacePath(`/employees/${employeeId}/shift-assignments/history`))
  )
}
