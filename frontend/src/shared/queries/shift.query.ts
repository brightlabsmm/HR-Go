import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  assignShift,
  createShift,
  deleteShift,
  getShift,
  getShiftAssignment,
  listEmployeeShiftAssignmentHistory,
  listEmployeeShiftAssignments,
  listShiftAssignments,
  listShifts,
  updateShift,
  type AssignShiftInput,
  type CreateShiftInput,
  type ShiftAssignmentListParams,
  type ShiftListParams,
  type UpdateShiftInput,
} from "@/shared/services/shift.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const shiftKeys = {
  all: ["shifts"] as const,
  lists: () => [...shiftKeys.all, "list"] as const,
  list: (params?: ShiftListParams) =>
    [...shiftKeys.lists(), params ?? {}] as const,
  details: () => [...shiftKeys.all, "detail"] as const,
  detail: (id: string) => [...shiftKeys.details(), id] as const,
  assignments: ["shift-assignments"] as const,
  assignmentLists: () => [...shiftKeys.assignments, "list"] as const,
  assignmentList: (params?: ShiftAssignmentListParams) =>
    [...shiftKeys.assignmentLists(), params ?? {}] as const,
  assignmentDetail: (id: string) =>
    [...shiftKeys.assignments, "detail", id] as const,
  employeeAssignments: (employeeId: string) =>
    [...shiftKeys.assignments, "employee", employeeId] as const,
  employeeAssignmentHistory: (employeeId: string) =>
    [...shiftKeys.assignments, "employee-history", employeeId] as const,
}

export function useShiftsQuery(params?: ShiftListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.list(params),
    queryFn: () => listShifts(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useShiftQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.detail(id),
    queryFn: () => getShift(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateShiftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateShiftInput) => createShift(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

export function useUpdateShiftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateShiftInput
    }) => updateShift(id, input),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(shiftKeys.detail(id), data)
      void queryClient.invalidateQueries({ queryKey: shiftKeys.lists() })
    },
  })
}

export function useDeleteShiftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

export function useShiftAssignmentsQuery(params?: ShiftAssignmentListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.assignmentList(params),
    queryFn: () => listShiftAssignments(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useShiftAssignmentQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.assignmentDetail(id),
    queryFn: () => getShiftAssignment(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useEmployeeShiftAssignmentsQuery(employeeId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.employeeAssignments(employeeId),
    queryFn: () => listEmployeeShiftAssignments(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useEmployeeShiftAssignmentHistoryQuery(employeeId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: shiftKeys.employeeAssignmentHistory(employeeId),
    queryFn: () => listEmployeeShiftAssignmentHistory(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useAssignShiftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignShiftInput) => assignShift(input),
    onSuccess: (_, { employeeId }) => {
      void queryClient.invalidateQueries({
        queryKey: shiftKeys.assignmentLists(),
      })
      void queryClient.invalidateQueries({
        queryKey: shiftKeys.employeeAssignments(employeeId),
      })
      void queryClient.invalidateQueries({
        queryKey: shiftKeys.employeeAssignmentHistory(employeeId),
      })
    },
  })
}
