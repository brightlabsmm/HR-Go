import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

export type HolidayType = "PUBLIC" | "COMPANY" | "OPTIONAL"

export interface Holiday {
  id: string
  organizationId: string
  branchId?: string | null
  branchName?: string | null
  holidayName: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  holidayType: HolidayType | string
  isPaid: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarHolidayItem {
  id: string
  holidayName: string
  startDate: string
  endDate: string
  holidayType: HolidayType | string
  isPaid: boolean
  branchId?: string | null
  branchName?: string | null
}

export interface CalendarResponse {
  year: number
  month?: number | null
  branchId?: string | null
  holidays: CalendarHolidayItem[]
}

export interface HolidayListParams extends ListQueryParams {
  year?: number
  branchId?: string
  startDate?: string
  endDate?: string
  holidayType?: string
}

export interface CalendarQueryParams {
  year: number
  month?: number
  branchId?: string
}

export interface CreateHolidayInput {
  holidayName: string
  startDate: string
  endDate: string
  branchId?: string | null
  holidayType?: HolidayType | string
  isPaid?: boolean
}

export interface UpdateHolidayInput {
  holidayName?: string
  startDate?: string
  endDate?: string
  branchId?: string | null
  holidayType?: HolidayType | string
  isPaid?: boolean
}

export function listHolidays(params?: HolidayListParams) {
  return unwrapPage<Holiday>(
    apiClient.get(workspacePath("/holidays"), {
      params: toListQuery(params),
    })
  )
}

export function getHoliday(id: string) {
  return unwrap<Holiday>(
    apiClient.get(workspacePath(`/holidays/${id}`))
  )
}

export function getHolidayCalendar(params: CalendarQueryParams) {
  return unwrap<CalendarResponse>(
    apiClient.get(workspacePath("/holidays/calendar"), {
      params: compactParams(params),
    })
  )
}

export function createHoliday(input: CreateHolidayInput) {
  return unwrap<Holiday>(
    apiClient.post(workspacePath("/holidays"), compactParams(input))
  )
}

export function updateHoliday(id: string, input: UpdateHolidayInput) {
  return unwrap<Holiday>(
    apiClient.put(workspacePath(`/holidays/${id}`), compactParams(input))
  )
}

export function deleteHoliday(id: string) {
  return unwrapEmpty(
    apiClient.delete(workspacePath(`/holidays/${id}`))
  )
}
