import { splitPermission } from "@/features/roles/use-permission-labels"
import type { Permission, Role } from "@/shared/services/role.service"

export interface PermissionGroup {
  grouping: string
  resource: string
  permissions: Permission[]
}

export interface GroupedPermissions {
  grouping: string
  permissions: Permission[]
}

export function resolvePermissionGrouping(permission: {
  code: string
  grouping?: string
  resource?: string
}): string {
  if (permission.grouping && permission.grouping.trim() !== "") {
    return permission.grouping.trim().toLowerCase()
  }

  const parts = permission.code.split(".")
  if (parts.length >= 2) {
    const resource = parts[1].toLowerCase()
    if (resource === "branch") return "branch"
    if (resource === "department") return "department"
    if (resource === "position") return "position"
    if (resource === "user") return "user"
    if (resource === "role" || resource === "permission") return "role"
    if (resource === "organization") return "organization"
  }

  return permission.resource?.toLowerCase() ?? "general"
}

export function groupPermissions(roles: Role[]): PermissionGroup[] {
  const grouped = new Map<string, { grouping: string; resource: string; permissions: Permission[] }>()

  for (const role of roles) {
    for (const permission of role.permissions) {
      const { resource } = splitPermission(permission.code)
      const grouping = resolvePermissionGrouping(permission)
      const key = `${grouping}:${resource}`

      const entry = grouped.get(key) ?? {
        grouping,
        resource,
        permissions: [],
      }

      if (!entry.permissions.some((item) => item.code === permission.code)) {
        entry.permissions.push({
          ...permission,
          grouping,
        })
      }
      grouped.set(key, entry)
    }
  }

  return [...grouped.values()]
    .sort((a, b) => {
      const groupingCompare = a.grouping.localeCompare(b.grouping)
      if (groupingCompare !== 0) return groupingCompare
      return a.resource.localeCompare(b.resource)
    })
    .map((item) => ({
      ...item,
      permissions: [...item.permissions].sort((a, b) => a.code.localeCompare(b.code)),
    }))
}

export function groupPermissionsByGrouping(permissions: Permission[]): GroupedPermissions[] {
  const map = new Map<string, Permission[]>()

  for (const permission of permissions) {
    const grouping = resolvePermissionGrouping(permission)
    const list = map.get(grouping) ?? []
    if (!list.some((p) => p.code === permission.code)) {
      list.push({
        ...permission,
        grouping,
      })
    }
    map.set(grouping, list)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([grouping, perms]) => ({
      grouping,
      permissions: [...perms].sort((a, b) => a.code.localeCompare(b.code)),
    }))
}
