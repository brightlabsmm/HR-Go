import { useMemo, useState } from "react"
import { ShieldCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { isPlatformPortal } from "@/app/portal"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { ToneBadge } from "@/components/common/tone-badge"
import { RolePermissionGrantEditor } from "@/features/roles/components/role-permission-grant-editor"
import { usePermissionsQuery, useRolesQuery } from "@/shared/queries/role.query"

export function RoleListPage() {
  const { t } = useTranslation("roles")
  const [searchParams, setSearchParams] = useSearchParams()

  const rolesQuery = useRolesQuery()
  const permissionsQuery = usePermissionsQuery(
    isPlatformPortal() ? undefined : "ORG"
  )

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const allPermissions = useMemo(
    () => permissionsQuery.data?.items ?? [],
    [permissionsQuery.data?.items]
  )

  const queryRoleId = searchParams.get("roleId")
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const activeRoleId = useMemo(() => {
    if (queryRoleId && roles.some((r) => r.id === queryRoleId)) {
      return queryRoleId
    }
    if (selectedRoleId && roles.some((r) => r.id === selectedRoleId)) {
      return selectedRoleId
    }
    return roles[0]?.id ?? null
  }, [roles, queryRoleId, selectedRoleId])

  function handleSelectRole(roleId: string) {
    setSelectedRoleId(roleId)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("roleId", roleId)
      return next
    })
  }

  const selectedRole = roles.find((r) => r.id === activeRoleId) ?? null

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8 pb-10">
      <PageHeader
        title={t(isPlatformPortal() ? "system_title" : "title", {
          defaultValue: isPlatformPortal() ? "Platform roles" : "Roles",
        })}
        description={t(isPlatformPortal() ? "system_subtitle" : "catalog_subtitle", {
          defaultValue: isPlatformPortal()
            ? "Built-in platform roles and their permissions."
            : "Roles available in this organization and what each one can do.",
        })}
      />

      {rolesQuery.isPending ? (
        <TableSkeleton columns={4} rows={8} />
      ) : roles.length === 0 ? (
        <PageEmptyState
          title={t("empty.title", { defaultValue: "No roles yet" })}
          description={t("empty.description", {
            defaultValue: "Roles are provided by the platform.",
          })}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* L: Roles Sidebar List */}
          <aside className="flex flex-col gap-3 lg:col-span-4 xl:col-span-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("catalog_heading", { defaultValue: "Roles" })}
            </h2>

            <div className="flex flex-col gap-2.5">
              {roles.map((role) => {
                const isSelected = role.id === activeRoleId

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-4 text-left transition-all outline-none ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <ShieldCheckIcon className="size-4" />
                        </span>
                        <span className="text-small-1 font-semibold text-foreground">
                          {role.roleName}
                        </span>
                      </div>

                      <ToneBadge tone={isSelected ? "brand" : "neutral"}>
                        {t("selected_count", {
                          count: role.permissions.length,
                          defaultValue: `${role.permissions.length} perms`,
                        })}
                      </ToneBadge>
                    </div>

                    <div className="flex flex-col gap-0.5 pl-10">
                      <span className="font-mono text-small-2 text-muted-foreground">
                        {role.roleCode}
                      </span>
                      {role.description ? (
                        <p className="line-clamp-2 text-small-2 text-muted-foreground">
                          {role.description}
                        </p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Right Panel: Role Permission Editor */}
          <main className="flex flex-col lg:col-span-8 xl:col-span-9">
            {selectedRole ? (
              <RolePermissionGrantEditor
                role={selectedRole}
                allPermissions={allPermissions}
              />
            ) : (
              <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>
                  {t("select_role_prompt", {
                    defaultValue: "Select a role on the left to set its permissions.",
                  })}
                </p>
              </div>
            )}
          </main>
        </div>
      )}
    </MotionStack>
  )
}
