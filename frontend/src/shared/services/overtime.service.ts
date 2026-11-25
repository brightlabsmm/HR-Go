import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"

export interface OvertimeCategory {
  id: string
  code: string
  name: string
  rateMultiplier: number
  minMinutes: number
  maxDailyMinutes: number
  status: string
}

export interface OvertimeRequestItem {
  id: string
  employeeId: string
  employeeCode: string
  employeeName: string
  overtimeCategoryId: string
  categoryCode: string
  categoryName: string
  multiplier: number
  workDate: string
  startTime: string
  endTime: string
  requestedMinutes: number
  reason: string
  requestStatus: string
  decisionNotes?: string | null
  createdAt: string
}

export async function listOvertimeCategories() {
  const res = await unwrap<{ items: OvertimeCategory[] }>(
    apiClient.get(workspacePath("/overtime/categories"))
  )
  return res.items ?? []
}

export function createOvertimeCategory(input: {
  code: string
  name: string
  rateMultiplier: number
  minMinutes: number
  maxDailyMinutes: number
}) {
  return unwrap<OvertimeCategory>(
    apiClient.post(workspacePath("/overtime/categories"), input)
  )
}

export function listOvertimeRequests(params?: {
  page?: number
  pageSize?: number
  status?: string
}) {
  return unwrapPage<OvertimeRequestItem>(
    apiClient.get(workspacePath("/overtime/requests"), {
      params: compactParams(params ?? {}),
    })
  )
}

export function reviewOvertimeRequest(
  id: string,
  input: { decision: "APPROVED" | "REJECTED"; remarks?: string | null }
) {
  return unwrap<OvertimeRequestItem>(
    apiClient.post(workspacePath(`/overtime/requests/${id}/review`), input)
  )
}
