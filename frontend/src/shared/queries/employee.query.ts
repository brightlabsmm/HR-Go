import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  changePosition,
  createEmployee,
  deleteEmployee,
  getEmployee,
  getPositionHistory,
  listEmployees,
  updateEmployee,
  type ChangePositionInput,
  type CreateEmployeeInput,
  type EmployeeListParams,
  type UpdateEmployeeInput,
} from "@/shared/services/employee.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params?: EmployeeListParams) =>
    [...employeeKeys.lists(), params ?? {}] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  positionHistory: (id: string) =>
    [...employeeKeys.detail(id), "position-history"] as const,
}

export function useEmployeesQuery(params?: EmployeeListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useEmployeeQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployee(id),
    enabled: Boolean(accessToken && id),
  })
}

export function usePositionHistoryQuery(employeeId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: employeeKeys.positionHistory(employeeId),
    queryFn: () => getPositionHistory(employeeId),
    enabled: Boolean(accessToken && employeeId),
  })
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateEmployeeInput
    }) => updateEmployee(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}

export function useChangePositionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string
      input: ChangePositionInput
    }) => changePosition(employeeId, input),
    onSuccess: (_, { employeeId }) => {
      void queryClient.invalidateQueries({
        queryKey: employeeKeys.positionHistory(employeeId),
      })
      void queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employeeId),
      })
      void queryClient.invalidateQueries({
        queryKey: employeeKeys.lists(),
      })
    },
  })
}
