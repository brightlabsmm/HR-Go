import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createDepartment,
  deactivateDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
  type DepartmentInput,
  type DepartmentListParams,
} from "@/shared/services/department.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params?: DepartmentListParams) =>
    [...departmentKeys.lists(), params ?? {}] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
}

export function useDepartmentsQuery(params?: DepartmentListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => listDepartments(params),
    enabled: Boolean(accessToken),
  })
}

export function useDepartmentQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DepartmentInput) => createDepartment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<DepartmentInput>
    }) => updateDepartment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

export function useDeactivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateDepartment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
