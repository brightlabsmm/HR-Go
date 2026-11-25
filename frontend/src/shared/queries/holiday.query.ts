import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createHoliday,
  deleteHoliday,
  getHoliday,
  getHolidayCalendar,
  listHolidays,
  updateHoliday,
  type CalendarQueryParams,
  type CreateHolidayInput,
  type HolidayListParams,
  type UpdateHolidayInput,
} from "@/shared/services/holiday.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const holidayKeys = {
  all: ["holidays"] as const,
  lists: () => [...holidayKeys.all, "list"] as const,
  list: (params?: HolidayListParams) =>
    [...holidayKeys.lists(), params ?? {}] as const,
  calendar: (params: CalendarQueryParams) =>
    [...holidayKeys.all, "calendar", params] as const,
  details: () => [...holidayKeys.all, "detail"] as const,
  detail: (id: string) => [...holidayKeys.details(), id] as const,
}

export function useHolidaysQuery(params?: HolidayListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: holidayKeys.list(params),
    queryFn: () => listHolidays(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useHolidayCalendarQuery(params: CalendarQueryParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: holidayKeys.calendar(params),
    queryFn: () => getHolidayCalendar(params),
    enabled: Boolean(accessToken && params.year > 0),
    placeholderData: keepPreviousData,
  })
}

export function useHolidayQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: holidayKeys.detail(id),
    queryFn: () => getHoliday(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateHolidayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateHolidayInput) => createHoliday(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}

export function useUpdateHolidayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateHolidayInput
    }) => updateHoliday(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: holidayKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: holidayKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: [...holidayKeys.all, "calendar"] })
    },
  })
}

export function useDeleteHolidayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: holidayKeys.all })
    },
  })
}
