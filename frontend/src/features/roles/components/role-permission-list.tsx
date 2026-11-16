import { useTranslation } from "react-i18next"

import { groupPermissions } from "@/features/roles/group-permissions"
import {
  splitPermission,
  usePermissionLabels,
} from "@/features/roles/use-permission-labels"

import type { Role } from "@/shared/services/role.service"

const ACTION_ORDER = [
  "read",
  "update",
  "create",
  "delete",
  "status_update",
  "assign",
  "deactivate",
  "manage",
]

interface RolePermissionListProps {
  role: Role
}

function uniqueActions(role: Role) {
  const actions = new Set(
    role.permissions.map((permission) => splitPermission(permission.code).action)
  )

  return [...actions].sort((left, right) => {
    const leftIndex = ACTION_ORDER.indexOf(left)
    const rightIndex = ACTION_ORDER.indexOf(right)

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right)
    }
    if (leftIndex === -1) {
      return 1
    }
    if (rightIndex === -1) {
      return -1
    }

    return leftIndex - rightIndex
  })
}

export function RolePermissionList({ role }: RolePermissionListProps) {
  const { t } = useTranslation("roles")
  const { resourceLabel, actionLabel } = usePermissionLabels()
  const groups = groupPermissions([role])
  const actions = uniqueActions(role)
  const granted = new Set(
    role.permissions.map((permission) => {
      const { resource, action } = splitPermission(permission.code)
      return `${resource}:${action}`
    })
  )

  if (groups.length === 0) {
    return (
      <p className="text-small-1 text-muted-foreground">{t("permissions.none")}</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-small-1">
        <thead>
          <tr>
            <th
              scope="col"
              className="h-12 border-b border-border pr-6 text-left font-medium text-foreground"
            >
              {t("form.permissions")}
            </th>
            {actions.map((action) => (
              <th
                key={action}
                scope="col"
                className="h-12 w-24 border-b border-border px-3 text-center font-medium text-foreground"
              >
                {actionLabel(action)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.resource}>
              <th
                scope="row"
                className="h-12 border-b border-hair pr-6 text-left font-normal text-foreground"
              >
                {resourceLabel(group.resource)}
              </th>
              {actions.map((action) => {
                const isGranted = granted.has(`${group.resource}:${action}`)

                return (
                  <td key={action} className="h-12 border-b border-hair px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isGranted}
                      readOnly
                      tabIndex={-1}
                      aria-readonly
                      className="size-4 accent-primary"
                      aria-label={`${resourceLabel(group.resource)} ${actionLabel(action)}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
