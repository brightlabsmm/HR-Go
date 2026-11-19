import { isPlatformPortal } from "@/app/portal"
import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { controlPath, workspacePath } from "@/app/api/paths"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

export interface Permission {
  id: string
  code: string
  scope?: string
  grouping?: string
  resource: string
  action: string
  description?: string | null
}

export interface Role {
  id: string
  roleCode: string
  roleName: string
  description?: string | null
  isSystem?: boolean
  permissions: Permission[]
}

export type RoleListParams = Pick<ListQueryParams, "sortBy" | "sortOrder" | "filter">

export interface PermissionListParams extends ListQueryParams {
  scope?: "PLATFORM" | "ORG"
  grouping?: string
}

function rolesPath() {
  return isPlatformPortal() ? controlPath("/roles") : workspacePath("/roles")
}

export function listRoles(params?: RoleListParams) {
  return unwrap<Role[]>(
    apiClient.get(rolesPath(), { params: toListQuery(params) })
  ).then((body) => (Array.isArray(body) ? body : []))
}

export function listPermissions(params?: PermissionListParams | "PLATFORM" | "ORG") {
  const query =
    typeof params === "string" ? { scope: params } : params

  return unwrapPage<Permission>(
    apiClient.get(controlPath("/permissions"), {
      params: toListQuery(query),
    })
  )
}

export function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return unwrap<Role>(
    apiClient.put(controlPath(`/roles/${roleId}/permissions`), {
      permissionIds,
    })
  )
}
