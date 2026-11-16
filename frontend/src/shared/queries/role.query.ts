import { useQuery } from "@tanstack/react-query"

import { isPlatformPortal } from "@/app/portal"
import { listPermissions, listRoles } from "@/shared/services/role.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  permissions: (scope?: "PLATFORM" | "ORG") =>
    [...roleKeys.all, "permissions", scope ?? "all"] as const,
}

export function useRolesQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: listRoles,
    enabled: Boolean(accessToken),
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

export function usePermissionsQuery(scope?: "PLATFORM" | "ORG") {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: roleKeys.permissions(scope),
    queryFn: () => listPermissions(scope),
    enabled: Boolean(accessToken && isPlatformPortal()),
  })
}
