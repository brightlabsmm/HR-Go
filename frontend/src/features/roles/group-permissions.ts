import { splitPermission } from "@/features/roles/use-permission-labels"

import type { Permission, Role } from "@/shared/services/role.service"

export interface PermissionGroup {
  resource: string
  permissions: Permission[]
}

export function groupPermissions(roles: Role[]) {
  const grouped = new Map<string, Permission[]>()

  for (const role of roles) {
    for (const permission of role.permissions) {
      const { resource } = splitPermission(permission.code)
      const list = grouped.get(resource) ?? []
      if (!list.some((item) => item.code === permission.code)) {
        list.push(permission)
      }
      grouped.set(resource, list)
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resource, permissions]): PermissionGroup => ({
      resource,
      permissions: [...permissions].sort((a, b) => a.code.localeCompare(b.code)),
    }))
}
