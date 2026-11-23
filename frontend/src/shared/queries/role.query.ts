import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listPermissions,
  listRoles,
  updateRolePermissions,
  type PermissionListParams,
  type RoleListParams,
} from "@/shared/services/role.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const roleKeys = {
  all: ["roles"] as const,
  list: (params?: RoleListParams) => [...roleKeys.all, "list", params ?? {}] as const,
  permissions: (params?: PermissionListParams | "PLATFORM" | "ORG") =>
    [...roleKeys.all, "permissions", params ?? "all"] as const,
}

export function useRolesQuery(params?: RoleListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => listRoles(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useRoleQuery(id: string) {
  const rolesQuery = useRolesQuery()
  const role = rolesQuery.data?.find((item) => item.id === id)

  return {
    ...rolesQuery,
    data: role,
  }
}

export function usePermissionsQuery(
  params?: PermissionListParams | "PLATFORM" | "ORG"
) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: roleKeys.permissions(params),
    queryFn: () => listPermissions(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateRolePermissionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string
      permissionIds: string[]
    }) => updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}
