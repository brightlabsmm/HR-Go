import { isPlatformPortal } from "@/app/portal"
import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { controlPath, workspacePath } from "@/app/api/paths"

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

function rolesPath() {
  return isPlatformPortal() ? controlPath("/roles") : workspacePath("/roles")
}

export function listRoles() {
  return unwrap<Role[]>(apiClient.get(rolesPath())).then((body) =>
    Array.isArray(body) ? body : []
  )
}

export function listPermissions(scope?: "PLATFORM" | "ORG") {
  return unwrapPage<Permission>(
    apiClient.get(controlPath("/permissions"), {
      params: scope ? { scope } : undefined,
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
