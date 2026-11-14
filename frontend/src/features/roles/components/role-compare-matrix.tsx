import { Fragment } from "react"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { groupPermissions } from "@/features/roles/group-permissions"
import {
  splitPermission,
  usePermissionLabels,
} from "@/features/roles/use-permission-labels"

import type { Role } from "@/shared/services/role.service"

interface RoleCompareMatrixProps {
  roles: Role[]
  selectedRoleId?: string | null
}

export function RoleCompareMatrix({
  roles,
  selectedRoleId = null,
}: RoleCompareMatrixProps) {
  const { t } = useTranslation("roles")
  const { resourceLabel, actionLabel } = usePermissionLabels()
  const granted = roles.map(
    (role) => new Set(role.permissions.map((permission) => permission.code))
  )
  const resources = groupPermissions(roles)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {t("compare_heading")}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] table-fixed border-separate border-spacing-0 text-small-1">
          <colgroup>
            <col className="w-44" />
            {roles.map((role) => (
              <col key={role.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-20 border-b border-border bg-surface py-4 pr-3 pl-1 text-left text-small-2 font-medium text-muted-foreground"
              >
                {t("form.permissions")}
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-10 border-b border-border bg-surface px-2 py-4 text-center align-bottom font-semibold text-secondary",
                    selectedRoleId === role.id && "bg-accent"
                  )}
                >
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="line-clamp-2 text-balance">{role.roleName}</span>
                    <span className="text-small-2 font-normal text-muted-foreground">
                      {role.roleCode}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((group) => (
              <Fragment key={group.resource}>
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={roles.length + 1}
                    className="border-b border-border px-1 pt-5 pb-2 text-left text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                  >
                    <span className="sticky left-1">{resourceLabel(group.resource)}</span>
                  </th>
                </tr>
                {group.permissions.map((permission) => {
                  const { action } = splitPermission(permission.code)

                  return (
                    <tr key={permission.code} className="group">
                      <th
                        scope="row"
                        title={permission.description ?? permission.code}
                        className="sticky left-0 z-10 h-12 border-b border-hair bg-surface px-1 text-left font-normal text-foreground group-hover:bg-accent/40"
                      >
                        {actionLabel(action)}
                      </th>
                      {roles.map((role, index) => {
                        const isGranted = granted[index].has(permission.code)
                        const isSelected = selectedRoleId === role.id

                        return (
                          <td
                            key={role.id}
                            className={cn(
                              "h-12 border-b border-hair px-2 text-center group-hover:bg-accent/40",
                              isSelected && "bg-accent"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex size-[22px] items-center justify-center rounded-full",
                                isGranted && "bg-success-muted text-success"
                              )}
                              aria-label={`${role.roleName}: ${permission.code}`}
                            >
                              {isGranted ? (
                                <CheckIcon className="size-3.5" strokeWidth={3} />
                              ) : (
                                <span className="size-1 rounded-full bg-grey" aria-hidden />
                              )}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
