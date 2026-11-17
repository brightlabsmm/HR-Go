import { useTranslation } from "react-i18next"

import {
  resolvePermissionGrouping,
} from "@/features/roles/group-permissions"
import { usePermissionLabels } from "@/features/roles/use-permission-labels"

import type { Role } from "@/shared/services/role.service"

interface RolePermissionListProps {
  role: Role
}

export function RolePermissionList({ role }: RolePermissionListProps) {
  const { t } = useTranslation("roles")
  const { groupingLabel, permissionLabel } = usePermissionLabels()

  const permissions = [...role.permissions].sort((a, b) => {
    const groupA = resolvePermissionGrouping(a)
    const groupB = resolvePermissionGrouping(b)
    const cmp = groupA.localeCompare(groupB)
    if (cmp !== 0) return cmp
    return a.code.localeCompare(b.code)
  })

  if (permissions.length === 0) {
    return (
      <p className="text-small-1 text-muted-foreground">{t("permissions.none")}</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[32rem] border-collapse text-small-1">
        <thead>
          <tr className="bg-muted/30">
            <th
              scope="col"
              className="h-12 w-44 border-b border-border px-4 text-left font-medium text-foreground"
            >
              {t("columns.grouping", { defaultValue: "Grouping" })}
            </th>
            <th
              scope="col"
              className="h-12 w-48 border-b border-border px-4 text-left font-medium text-foreground"
            >
              {t("columns.permission", { defaultValue: "Permission" })}
            </th>
            <th
              scope="col"
              className="h-12 border-b border-border px-4 text-left font-medium text-foreground"
            >
              {t("columns.description", { defaultValue: "Description" })}
            </th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => {
            const grouping = resolvePermissionGrouping(permission)

            return (
              <tr
                key={permission.id || permission.code}
                title={permission.code}
                className="transition-colors hover:bg-accent/40"
              >
                <td className="h-11 border-b border-hair px-4 font-medium text-foreground">
                  <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-small-2 font-medium text-secondary">
                    {groupingLabel(grouping)}
                  </span>
                </td>
                <td className="h-11 border-b border-hair px-4 font-medium text-foreground">
                  {permissionLabel(permission)}
                </td>
                <td className="h-11 border-b border-hair px-4 text-small-2 text-muted-foreground">
                  {permission.description || "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
