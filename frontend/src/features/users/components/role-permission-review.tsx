import { useTranslation } from "react-i18next"

import { groupPermissions } from "@/features/roles/group-permissions"
import {
  splitPermission,
  usePermissionLabels,
} from "@/features/roles/use-permission-labels"

import type { Role } from "@/shared/services/role.service"

interface RolePermissionReviewProps {
  role?: Role | null
}

export function RolePermissionReview({ role = null }: RolePermissionReviewProps) {
  const { t } = useTranslation("users")
  const { resourceLabel, actionLabel } = usePermissionLabels()
  const groups = role ? groupPermissions([role]) : []

  if (!role) {
    return (
      <p className="text-small-1 text-muted-foreground">{t("permissions.empty")}</p>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="text-small-1 text-muted-foreground">{t("permissions.none")}</p>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {groups.map((group) => {
        const actions = group.permissions
          .map((permission) => actionLabel(splitPermission(permission.code).action))
          .join(", ")

        return (
          <div key={group.resource} className="flex min-w-0 flex-col gap-1.5">
            <p className="text-small-2 font-medium text-muted-foreground">
              {resourceLabel(group.resource)}
            </p>
            <p className="text-body-2 text-foreground">{actions}</p>
          </div>
        )
      })}
    </div>
  )
}
