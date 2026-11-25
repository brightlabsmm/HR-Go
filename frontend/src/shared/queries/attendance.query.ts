import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  checkInAttendance,
  checkOutAttendance,
  createAttendanceCorrection,
  getAttendanceCorrection,
  getAttendanceRecord,
  getAttendanceSummary,
  listAttendanceCorrections,
  listAttendanceRecords,
  manualAttendanceEntry,
  reviewAttendanceCorrection,
  type AttendanceListParams,
  type AttendanceSummaryParams,
  type CheckInInput,
  type CheckOutInput,
  type CorrectionListParams,
  type CreateCorrectionInput,
  type ManualAttendanceInput,
  type ReviewCorrectionInput,
} from "@/shared/services/attendance.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const attendanceKeys = {
  all: ["attendance"] as const,
  records: () => [...attendanceKeys.all, "records"] as const,
  recordList: (params?: AttendanceListParams) =>
    [...attendanceKeys.records(), "list", params ?? {}] as const,
  recordDetail: (id: string) =>
    [...attendanceKeys.records(), "detail", id] as const,
  summary: (params: AttendanceSummaryParams) =>
    [...attendanceKeys.all, "summary", params] as const,
  corrections: () => [...attendanceKeys.all, "corrections"] as const,
  correctionList: (params?: CorrectionListParams) =>
    [...attendanceKeys.corrections(), "list", params ?? {}] as const,
  correctionDetail: (id: string) =>
    [...attendanceKeys.corrections(), "detail", id] as const,
}

export function useAttendanceRecordsQuery(params?: AttendanceListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: attendanceKeys.recordList(params),
    queryFn: () => listAttendanceRecords(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useAttendanceRecordQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: attendanceKeys.recordDetail(id),
    queryFn: () => getAttendanceRecord(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useAttendanceSummaryQuery(
  params: AttendanceSummaryParams,
  enabled = true
) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: attendanceKeys.summary(params),
    queryFn: () => getAttendanceSummary(params),
    enabled: Boolean(accessToken && params.from && params.to && enabled),
    placeholderData: keepPreviousData,
  })
}

export function useAttendanceCorrectionsQuery(params?: CorrectionListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: attendanceKeys.correctionList(params),
    queryFn: () => listAttendanceCorrections(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useAttendanceCorrectionQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: attendanceKeys.correctionDetail(id),
    queryFn: () => getAttendanceCorrection(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCheckInMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CheckInInput) => checkInAttendance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CheckOutInput) => checkOutAttendance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

export function useManualAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ManualAttendanceInput) => manualAttendanceEntry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}

export function useCreateCorrectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCorrectionInput) =>
      createAttendanceCorrection(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.corrections(),
      })
    },
  })
}

export function useReviewCorrectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: ReviewCorrectionInput
    }) => reviewAttendanceCorrection(id, input),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(attendanceKeys.correctionDetail(id), data)
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.corrections(), "list"],
      })
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.records(),
      })
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, "summary"],
      })
    },
  })
}
