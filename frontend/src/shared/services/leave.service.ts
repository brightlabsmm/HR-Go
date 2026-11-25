import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"

export interface LeaveType {
  id: string
  code: string
  name: string
  isPaid: boolean
  requiresBalance: boolean
  annualAllowance: number
  status: string
}

export interface LeaveRequestItem {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  leaveTypeId: string
  leaveTypeCode: string
  leaveTypeName: string
  startDate: string
  endDate: string
  isHalfDay: boolean
  requestedDays: number
  reason: string
  requestStatus: string
  decisionNotes?: string | null
  createdAt: string
}

export async function listLeaveTypes() {
  const res = await unwrap<{ items: LeaveType[] }>(
    apiClient.get(workspacePath("/leave/types"))
  )
  return res.items ?? []
}

export function createLeaveType(input: {
  code: string
  name: string
  annualAllowance: number
  isPaid?: boolean
  requiresBalance?: boolean
}) {
  return unwrap<LeaveType>(apiClient.post(workspacePath("/leave/types"), input))
}

export function listLeaveRequests(params?: {
  page?: number
  pageSize?: number
  status?: string
}) {
  return unwrapPage<LeaveRequestItem>(
    apiClient.get(workspacePath("/leave/requests"), {
      params: compactParams(params ?? {}),
    })
  )
}

export function reviewLeaveRequest(
  id: string,
  input: { decision: "APPROVED" | "REJECTED"; remarks?: string | null }
) {
  return unwrap<LeaveRequestItem>(
    apiClient.post(workspacePath(`/leave/requests/${id}/review`), input)
  )
}
