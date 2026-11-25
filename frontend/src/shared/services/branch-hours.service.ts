import { apiClient } from "@/app/api/client"
import { unwrap } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export interface BranchOperatingHour {
  id: string
  organizationId: string
  branchId: string
  dayOfWeek: DayOfWeek
  openingTime: string | null
  closingTime: string | null
  isClosed: boolean
  createdAt: string
  updatedAt: string
}

export interface OperatingHourInput {
  dayOfWeek: DayOfWeek
  openingTime: string | null
  closingTime: string | null
  isClosed: boolean
}

export async function listBranchOperatingHours(branchId: string) {
  const res = await unwrap<{ items: BranchOperatingHour[] }>(
    apiClient.get(workspacePath(`/branches/${branchId}/operating-hours`))
  )
  return res.items ?? []
}

export async function upsertBranchOperatingHours(
  branchId: string,
  hours: OperatingHourInput[]
) {
  const res = await unwrap<{ items: BranchOperatingHour[] }>(
    apiClient.put(workspacePath(`/branches/${branchId}/operating-hours`), {
      hours,
    })
  )
  return res.items ?? []
}
