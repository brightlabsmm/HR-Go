import { Fragment, useMemo, useState } from "react"
import {
  Building2Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  KeyRoundIcon,
  LayersIcon,
  SaveIcon,
  ShieldCheckIcon,
  Undo2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { isPlatformPortal } from "@/app/portal"
import { SearchBox } from "@/components/common/search-box"
import { FilterSelect, type FilterSelectItem } from "@/components/common/filter-select"
import { ToneBadge } from "@/components/common/tone-badge"
import { Button } from "@/components/ui/button"
import {
  groupPermissionsByGrouping,
  resolvePermissionGrouping,
} from "@/features/roles/group-permissions"
import { usePermissionLabels } from "@/features/roles/use-permission-labels"
import { useUpdateRolePermissionsMutation } from "@/shared/queries/role.query"
import { toast } from "@/shared/stores/toast.store"

import type { Permission, Role } from "@/shared/services/role.service"

interface RolePermissionGrantEditorProps {
  role: Role
  allPermissions: Permission[]
}

const ACTION_ORDER: Record<string, number> = {
  read: 1,
  create: 2,
  update: 3,
  status_update: 4,
  assign: 5,
  deactivate: 6,
  delete: 7,
}

function resolvePermissionScope(p: { code: string; scope?: string }): "PLATFORM" | "ORG" {
  if (p.scope && p.scope.toUpperCase() === "ORG") return "ORG"
  if (p.scope && p.scope.toUpperCase() === "PLATFORM") return "PLATFORM"
  if (p.code.toLowerCase().startsWith("org.")) return "ORG"
  return "PLATFORM"
}

function sortPermissions(perms: Permission[]): Permission[] {
  return [...perms].sort((a, b) => {
    const actA = a.action?.toLowerCase().replaceAll(".", "_") || ""
    const actB = b.action?.toLowerCase().replaceAll(".", "_") || ""
    const orderA = ACTION_ORDER[actA] ?? 99
    const orderB = ACTION_ORDER[actB] ?? 99
    if (orderA !== orderB) return orderA - orderB
    return a.code.localeCompare(b.code)
  })
}

export function RolePermissionGrantEditor({
  role,
  allPermissions,
}: RolePermissionGrantEditorProps) {
  const { t } = useTranslation("roles")
  const { groupingLabel, permissionLabel } = usePermissionLabels()
  const updateMutation = useUpdateRolePermissionsMutation()
  const isPlatform = isPlatformPortal()

  // Track selected permission IDs in local draft state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(role.permissions.map((p) => p.id))
  })
  const [search, setSearch] = useState<string>("")
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>("all")
  const [scopeTab, setScopeTab] = useState<"ALL" | "PLATFORM" | "ORG">(
    isPlatform ? "ALL" : "ORG"
  )

  // Hide first: All groups collapsed by default in (Grant permissions)
  // Keys formatted as `${scope}:${grouping}`
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Access section list expansion state (expanded by default)
  const [isAccessExpanded, setIsAccessExpanded] = useState<boolean>(true)

  // Initial role permission IDs set for dirty check
  const initialIds = useMemo(() => {
    return new Set(role.permissions.map((p) => p.id))
  }, [role.permissions])

  const isDirty = useMemo(() => {
    if (selectedIds.size !== initialIds.size) return true
    for (const id of selectedIds) {
      if (!initialIds.has(id)) return true
    }
    return false
  }, [selectedIds, initialIds])

  // All available unique groupings based on scopeTab
  const availableGroupings = useMemo(() => {
    const currentList =
      scopeTab === "PLATFORM"
        ? allPermissions.filter((p) => resolvePermissionScope(p) === "PLATFORM")
        : scopeTab === "ORG"
        ? allPermissions.filter((p) => resolvePermissionScope(p) === "ORG")
        : allPermissions

    const set = new Set<string>()
    for (const p of currentList) {
      set.add(resolvePermissionGrouping(p))
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [allPermissions, scopeTab])

  // Grouping options for dropdown filter
  const groupingItems: FilterSelectItem[] = useMemo(() => {
    return [
      {
        value: "all",
        label: t("filters.all_groupings", { defaultValue: "All groupings" }),
      },
      ...availableGroupings.map((grp) => ({
        value: grp,
        label: groupingLabel(grp),
      })),
    ]
  }, [availableGroupings, groupingLabel, t])

  // Derived effective group filter (falls back to "all" if grouping not in current scope)
  const effectiveGroupFilter = availableGroupings.includes(activeGroupFilter)
    ? activeGroupFilter
    : "all"

  // Filter available permissions for the grant section
  const filteredGrantPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      const grouping = resolvePermissionGrouping(p)
      if (effectiveGroupFilter !== "all" && grouping !== effectiveGroupFilter) {
        return false
      }
      if (!search.trim()) return true
      const term = search.trim().toLowerCase()
      const label = permissionLabel(p).toLowerCase()
      const code = p.code.toLowerCase()
      const desc = (p.description ?? "").toLowerCase()
      const grp = grouping.toLowerCase()
      return (
        label.includes(term) ||
        code.includes(term) ||
        desc.includes(term) ||
        grp.includes(term)
      )
    })
  }, [allPermissions, effectiveGroupFilter, search, permissionLabel])

  // Split permissions by scope
  const platformGrantPermissions = useMemo(() => {
    return filteredGrantPermissions.filter((p) => resolvePermissionScope(p) === "PLATFORM")
  }, [filteredGrantPermissions])

  const orgGrantPermissions = useMemo(() => {
    return filteredGrantPermissions.filter((p) => resolvePermissionScope(p) === "ORG")
  }, [filteredGrantPermissions])

  // Grouped permissions by scope
  const platformGrantGroups = useMemo(() => {
    const rawGroups = groupPermissionsByGrouping(platformGrantPermissions)
    return rawGroups.map((g) => ({
      ...g,
      permissions: sortPermissions(g.permissions),
    }))
  }, [platformGrantPermissions])

  const orgGrantGroups = useMemo(() => {
    const rawGroups = groupPermissionsByGrouping(orgGrantPermissions)
    return rawGroups.map((g) => ({
      ...g,
      permissions: sortPermissions(g.permissions),
    }))
  }, [orgGrantPermissions])

  // Currently granted permissions for the Access section (directly listed)
  const currentAccessPermissions = useMemo(() => {
    return sortPermissions(role.permissions).sort((a, b) => {
      const scopeA = resolvePermissionScope(a)
      const scopeB = resolvePermissionScope(b)
      if (scopeA !== scopeB) return scopeA.localeCompare(scopeB)

      const groupA = resolvePermissionGrouping(a)
      const groupB = resolvePermissionGrouping(b)
      const cmp = groupA.localeCompare(groupB)
      if (cmp !== 0) return cmp
      return a.code.localeCompare(b.code)
    })
  }, [role.permissions])

  function togglePermission(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleGroupExpanded(scope: "PLATFORM" | "ORG", grouping: string) {
    const key = `${scope}:${grouping}`
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function toggleGroupPermissions(group: { permissions: Permission[] }) {
    const allChecked = group.permissions.every((p) => selectedIds.has(p.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const p of group.permissions) {
        if (allChecked) {
          next.delete(p.id)
        } else {
          next.add(p.id)
        }
      }
      return next
    })
  }

  function handleExpandAll() {
    const next = new Set<string>()
    for (const g of platformGrantGroups) next.add(`PLATFORM:${g.grouping}`)
    for (const g of orgGrantGroups) next.add(`ORG:${g.grouping}`)
    setExpandedGroups(next)
  }

  function handleCollapseAll() {
    setExpandedGroups(new Set())
  }

  function handleSelectAllFiltered() {
    const targets =
      scopeTab === "PLATFORM"
        ? platformGrantPermissions
        : scopeTab === "ORG"
        ? orgGrantPermissions
        : filteredGrantPermissions

    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const p of targets) {
        next.add(p.id)
      }
      return next
    })
  }

  function handleDeselectAllFiltered() {
    const targets =
      scopeTab === "PLATFORM"
        ? platformGrantPermissions
        : scopeTab === "ORG"
        ? orgGrantPermissions
        : filteredGrantPermissions

    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const p of targets) {
        next.delete(p.id)
      }
      return next
    })
  }

  function handleReset() {
    setSelectedIds(new Set(role.permissions.map((p) => p.id)))
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        roleId: role.id,
        permissionIds: Array.from(selectedIds),
      })
      toast.success(
        t("save_success", {
          defaultValue: "Role permissions updated successfully.",
        })
      )
    } catch {
      // Handled globally
    }
  }

  // Count active selections per scope
  const platformSelectedCount = useMemo(() => {
    return allPermissions
      .filter((p) => resolvePermissionScope(p) === "PLATFORM")
      .filter((p) => selectedIds.has(p.id)).length
  }, [allPermissions, selectedIds])

  const orgSelectedCount = useMemo(() => {
    return allPermissions
      .filter((p) => resolvePermissionScope(p) === "ORG")
      .filter((p) => selectedIds.has(p.id)).length
  }, [allPermissions, selectedIds])

  const totalPlatformCount = useMemo(() => {
    return allPermissions.filter((p) => resolvePermissionScope(p) === "PLATFORM").length
  }, [allPermissions])

  const totalOrgCount = useMemo(() => {
    return allPermissions.filter((p) => resolvePermissionScope(p) === "ORG").length
  }, [allPermissions])

  const visibleGroupsCount =
    (scopeTab === "ORG" ? 0 : platformGrantGroups.length) +
    (scopeTab === "PLATFORM" ? 0 : orgGrantGroups.length)

  const isAllExpanded =
    visibleGroupsCount > 0 &&
    (scopeTab === "ORG" ||
      platformGrantGroups.every((g) => expandedGroups.has(`PLATFORM:${g.grouping}`))) &&
    (scopeTab === "PLATFORM" ||
      orgGrantGroups.every((g) => expandedGroups.has(`ORG:${g.grouping}`)))

  // Helper to render a collapsible table for a given scope and its groups
  function renderScopeTable(
    scope: "PLATFORM" | "ORG",
    groups: Array<{ grouping: string; permissions: Permission[] }>
  ) {
    if (groups.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-small-2 text-muted-foreground">
          {t("empty.permissions_title", {
            defaultValue: "No permissions match your filter.",
          })}
        </div>
      )
    }

    return (
      <>
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs md:hidden">
        {groups.map((group) => {
          const groupKey = `${scope}:${group.grouping}`
          const isExpanded =
            Boolean(search.trim()) ||
            (effectiveGroupFilter !== "all" && group.grouping === effectiveGroupFilter) ||
            expandedGroups.has(groupKey)
          const groupCheckedCount = group.permissions.filter((p) =>
            selectedIds.has(p.id)
          ).length
          const isAllGroupChecked =
            groupCheckedCount === group.permissions.length &&
            group.permissions.length > 0
          const isGroupIndeterminate =
            groupCheckedCount > 0 && groupCheckedCount < group.permissions.length

          return (
            <div key={groupKey} className="border-b border-border last:border-b-0">
              <div className="flex items-start gap-3 p-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  onClick={() => toggleGroupExpanded(scope, group.grouping)}
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  ) : (
                    <ChevronRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="inline-flex w-fit rounded-md bg-accent px-2 py-0.5 text-small-2 font-semibold text-secondary">
                      {groupingLabel(group.grouping)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {groupCheckedCount} / {group.permissions.length} granted
                    </span>
                  </span>
                </button>
                <input
                  type="checkbox"
                  checked={isAllGroupChecked}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = isGroupIndeterminate
                    }
                  }}
                  onChange={() => toggleGroupPermissions(group)}
                  className="mt-1 size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                  aria-label={`Toggle all ${groupingLabel(group.grouping)} permissions`}
                />
              </div>
              {isExpanded
                ? group.permissions.map((permission) => {
                    const isChecked = selectedIds.has(permission.id)

                    return (
                      <label
                        key={`grant-mobile-${permission.id || permission.code}`}
                        className={`flex items-start gap-3 border-t border-hair px-3 py-3 ${
                          isChecked ? "bg-primary/5" : "bg-muted/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
                          aria-label={`Grant ${permission.code}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-small-2 font-medium break-words text-foreground">
                            {permissionLabel(permission)}
                          </span>
                          {permission.description ? (
                            <span className="mt-0.5 block text-[11px] break-words text-muted-foreground">
                              {permission.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )
                  })
                : null}
            </div>
          )
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface shadow-xs md:block">
        <table className="w-full min-w-[34rem] border-collapse text-small-1">
          <thead>
            <tr className="bg-muted/30">
              <th
                scope="col"
                className="h-9 w-52 border-b border-r border-border px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground"
              >
                {t("columns.grouping", { defaultValue: "Grouping" })}
              </th>
              <th
                scope="col"
                className="h-9 border-b border-border px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground"
              >
                {t("columns.permission", { defaultValue: "Permission" })}
              </th>
              <th
                scope="col"
                className="h-9 w-16 border-b border-border px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground"
              >
                {t("columns.grant", { defaultValue: "Grant" })}
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const groupKey = `${scope}:${group.grouping}`
              const isExpanded =
                Boolean(search.trim()) ||
                (effectiveGroupFilter !== "all" && group.grouping === effectiveGroupFilter) ||
                expandedGroups.has(groupKey)
              const groupCheckedCount = group.permissions.filter((p) =>
                selectedIds.has(p.id)
              ).length
              const isAllGroupChecked =
                groupCheckedCount === group.permissions.length &&
                group.permissions.length > 0
              const isGroupIndeterminate =
                groupCheckedCount > 0 && groupCheckedCount < group.permissions.length

              return (
                <Fragment key={groupKey}>
                  {/* Compact Group Header Row */}
                  <tr
                    onClick={() => toggleGroupExpanded(scope, group.grouping)}
                    className={`cursor-pointer transition-colors border-b ${
                      isExpanded
                        ? "bg-muted/35 border-hair"
                        : "hover:bg-accent/40 bg-surface border-border"
                    }`}
                  >
                    <td className="w-52 border-r border-border/60 px-4 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="size-4 shrink-0 text-primary" />
                        ) : (
                          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="inline-flex rounded-md bg-accent px-2 py-0.5 text-small-2 font-semibold text-secondary">
                          {groupingLabel(group.grouping)}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          ({group.permissions.length})
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] text-muted-foreground">
                          {groupCheckedCount} / {group.permissions.length} granted
                        </span>
                        <span className="text-[11px] text-primary hover:underline font-medium">
                          {isExpanded
                            ? t("collapse", { defaultValue: "Hide" })
                            : t("expand", { defaultValue: "Show permissions" })}
                        </span>
                      </div>
                    </td>

                    <td
                      className="w-16 px-3 py-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isAllGroupChecked}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = isGroupIndeterminate
                          }
                        }}
                        onChange={() => toggleGroupPermissions(group)}
                        className="size-4 cursor-pointer rounded border-border accent-primary"
                        aria-label={`Toggle all ${groupingLabel(group.grouping)} permissions`}
                      />
                    </td>
                  </tr>

                  {/* Expandable Permissions (Hidden by default / "hide first") */}
                  {isExpanded &&
                    group.permissions.map((permission, pIdx) => {
                      const isChecked = selectedIds.has(permission.id)
                      const isLast = pIdx === group.permissions.length - 1

                      return (
                        <tr
                          key={`grant-${permission.id || permission.code}`}
                          title={permission.code}
                          onClick={() => togglePermission(permission.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-accent/30 bg-muted/10"
                          } ${isLast ? "border-b border-border" : "border-b border-hair"}`}
                        >
                          {/* Indented spacer column under Grouping (code removed) */}
                          <td className="w-52 border-r border-border/50 py-1.5 pl-9 pr-4" />

                          {/* Permission details */}
                          <td className="px-4 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-small-2">
                                {permissionLabel(permission)}
                              </span>
                              {permission.description ? (
                                <span className="text-[11px] text-muted-foreground">
                                  — {permission.description}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Checkbox */}
                          <td
                            className="w-16 px-3 py-1.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(permission.id)}
                              className="size-4 cursor-pointer rounded border-border accent-primary"
                              aria-label={`Grant ${permission.code}`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      </>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Role Header Card */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-body-1 font-semibold break-words text-foreground">
                  {role.roleName}
                </h2>
                <span className="font-mono text-small-2 text-muted-foreground">
                  ({role.roleCode})
                </span>
              </div>
              {role.description ? (
                <p className="text-small-2 text-muted-foreground">
                  {role.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ToneBadge tone="brand">
              {t("selected_count", { count: role.permissions.length })}
            </ToneBadge>
          </div>
        </div>
      </div>

      {/* Access Section (Direct Permission List) */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.access", { defaultValue: "Access" })}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small-2 text-muted-foreground">
              {t("active_count", {
                count: role.permissions.length,
                defaultValue: `${role.permissions.length} granted permissions`,
              })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsAccessExpanded((prev) => !prev)}
              className="gap-1.5 text-small-2"
            >
              {isAccessExpanded ? (
                <>
                  <ChevronsDownUpIcon className="size-3" />
                  {t("collapse_list", { defaultValue: "Collapse list" })}
                </>
              ) : (
                <>
                  <ChevronsUpDownIcon className="size-3" />
                  {t("expand_list", { defaultValue: "Expand list" })}
                </>
              )}
            </Button>
          </div>
        </div>

        {isAccessExpanded && (
          <>
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs md:hidden">
            {currentAccessPermissions.length === 0 ? (
              <p className="p-4 text-center text-small-2 text-muted-foreground">
                {t("permissions.none", {
                  defaultValue: "This role has no permissions.",
                })}
              </p>
            ) : (
              currentAccessPermissions.map((permission) => {
                const grouping = resolvePermissionGrouping(permission)
                const scope = resolvePermissionScope(permission)

                return (
                  <div
                    key={`access-mobile-${permission.id || permission.code}`}
                    className="flex flex-col gap-1.5 border-b border-hair p-3 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-small-2 font-medium text-secondary">
                        {groupingLabel(grouping)}
                      </span>
                      <ToneBadge tone={scope === "PLATFORM" ? "brand" : "neutral"}>
                        {scope}
                      </ToneBadge>
                    </div>
                    <p className="text-small-1 font-medium break-words text-foreground">
                      {permissionLabel(permission)}
                    </p>
                    {permission.description ? (
                      <p className="text-small-2 break-words text-muted-foreground">
                        {permission.description}
                      </p>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface shadow-xs md:block">
            <table className="w-full min-w-[32rem] border-collapse text-small-1">
              <thead>
                <tr className="bg-muted/40">
                  <th
                    scope="col"
                    className="h-11 w-40 border-b border-border px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("columns.grouping", { defaultValue: "Grouping" })}
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-28 border-b border-border px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("columns.scope", { defaultValue: "Scope" })}
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-44 border-b border-border px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("columns.permission", { defaultValue: "Permission" })}
                  </th>
                  <th
                    scope="col"
                    className="h-11 border-b border-border px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("columns.description", { defaultValue: "Description" })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentAccessPermissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="h-16 px-4 text-center text-small-2 text-muted-foreground"
                    >
                      {t("permissions.none", {
                        defaultValue: "This role has no permissions.",
                      })}
                    </td>
                  </tr>
                ) : (
                  currentAccessPermissions.map((permission) => {
                    const grouping = resolvePermissionGrouping(permission)
                    const scope = resolvePermissionScope(permission)

                    return (
                      <tr
                        key={`access-${permission.id || permission.code}`}
                        title={permission.code}
                        className="border-b border-hair hover:bg-accent/40 transition-colors"
                      >
                        <td className="h-12 px-4 py-2.5 font-medium text-foreground">
                          <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-small-2 font-medium text-secondary">
                            {groupingLabel(grouping)}
                          </span>
                        </td>
                        <td className="h-12 px-3 py-2.5">
                          <ToneBadge tone={scope === "PLATFORM" ? "brand" : "neutral"}>
                            {scope}
                          </ToneBadge>
                        </td>
                        <td className="h-12 px-4 py-2.5 font-medium text-foreground">
                          {permissionLabel(permission)}
                        </td>
                        <td className="h-12 px-4 py-2.5 text-small-2 text-muted-foreground">
                          {permission.description || "—"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {/* Visual Separator: More Space between Access & Grant Permissions */}
      <div className="my-4 border-t border-border md:my-8" />

      {/* Grant Permissions Section */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon className="size-4 text-primary" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.grant_permissions", {
                defaultValue: "(Grant permissions)",
              })}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small-2 font-medium text-foreground">
              {t("selected_permissions_counter", {
                selected: selectedIds.size,
                total: allPermissions.length,
                defaultValue: `${selectedIds.size} of ${allPermissions.length} selected`,
              })}
            </span>
            {isDirty ? (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {t("unsaved_changes", { defaultValue: "Unsaved changes" })}
              </span>
            ) : null}
            <Button
              type="button"
              variant="default"
              size="sm"
              loading={updateMutation.isPending}
              disabled={!isDirty || updateMutation.isPending}
              onClick={handleSave}
              className="w-full gap-1.5 sm:w-auto"
            >
              <SaveIcon className="size-3.5" />
              {t("save", { defaultValue: "Save" })}
            </Button>
          </div>
        </div>

        {/* Filter Bar with Scope Switcher, Grouping Dropdown & Right-aligned Search/Actions */}
        <div className="rounded-lg border border-border bg-surface p-2 shadow-xs">
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {isPlatform ? (
                <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-muted/20 p-0.5 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setScopeTab("ALL")}
                    className={`shrink-0 cursor-pointer whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium transition-all ${
                      scopeTab === "ALL"
                        ? "bg-surface text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("scopes.all", { defaultValue: "All" })} ({allPermissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab("PLATFORM")}
                    className={`flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium transition-all ${
                      scopeTab === "PLATFORM"
                        ? "bg-surface text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayersIcon className="size-3 text-primary" />
                    <span>{t("scopes.platform", { defaultValue: "Platform" })}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({platformSelectedCount}/{totalPlatformCount})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeTab("ORG")}
                    className={`flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium transition-all ${
                      scopeTab === "ORG"
                        ? "bg-surface text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2Icon className="size-3 text-muted-foreground" />
                    <span>{t("scopes.org", { defaultValue: "Organization" })}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({orgSelectedCount}/{totalOrgCount})
                    </span>
                  </button>
                </div>
              ) : null}

              {/* Grouping Filter Dropdown */}
              <FilterSelect
                items={groupingItems}
                value={effectiveGroupFilter}
                label={t("columns.grouping", { defaultValue: "Grouping" })}
                onValueChange={setActiveGroupFilter}
                className="!h-9 w-full text-xs data-[size=default]:!h-9 sm:!h-7 sm:w-36 sm:data-[size=default]:!h-7 [&>button]:!h-9 [&>button]:px-2 [&>button]:text-xs sm:[&>button]:!h-7"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
              <SearchBox
                value={search}
                onValueChange={setSearch}
                placeholder={t("search_placeholder", {
                  defaultValue: "Search permissions...",
                })}
                className="h-9 w-full text-xs sm:!h-7 sm:w-40 [&>div]:!pl-2 [&>div]:!pr-1.5 [&_input]:!h-9 [&_input]:!text-xs sm:[&_input]:!h-7 [&_svg]:!size-3"
              />

              <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
                className="h-9 flex-1 gap-1 px-2 text-xs sm:!h-7 sm:flex-none"
              >
                {isAllExpanded ? (
                  <>
                    <ChevronsDownUpIcon className="size-3" />
                    {t("collapse_all", { defaultValue: "Collapse all" })}
                  </>
                ) : (
                  <>
                    <ChevronsUpDownIcon className="size-3" />
                    {t("expand_all", { defaultValue: "Expand all" })}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleSelectAllFiltered}
                className="h-9 flex-1 px-2 text-xs sm:!h-7 sm:flex-none"
              >
                {t("select_all", { defaultValue: "Select all" })}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleDeselectAllFiltered}
                className="h-9 flex-1 px-2 text-xs sm:!h-7 sm:flex-none"
              >
                {t("deselect_all", { defaultValue: "Deselect all" })}
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Platform Permissions */}
        {isPlatform && (scopeTab === "ALL" || scopeTab === "PLATFORM") && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 border-b border-border pb-1.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <LayersIcon className="size-4 text-primary" />
                <h4 className="text-small-1 font-semibold text-foreground">
                  {t("scopes.platform_permissions", {
                    defaultValue: "Platform Permissions",
                  })}
                </h4>
                <ToneBadge tone="brand">PLATFORM</ToneBadge>
              </div>
              <span className="text-[12px] text-muted-foreground">
                {platformSelectedCount} / {totalPlatformCount} granted
              </span>
            </div>
            {renderScopeTable("PLATFORM", platformGrantGroups)}
          </div>
        )}

        {/* Section 2: Organization Permissions */}
        {(scopeTab === "ALL" || scopeTab === "ORG") && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 border-b border-border pb-1.5 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Building2Icon className="size-4 text-muted-foreground" />
                <h4 className="text-small-1 font-semibold text-foreground">
                  {t("scopes.org_permissions", {
                    defaultValue: "Organization Permissions",
                  })}
                </h4>
                <ToneBadge tone="neutral">ORG</ToneBadge>
              </div>
              <span className="text-[12px] text-muted-foreground">
                {orgSelectedCount} / {totalOrgCount} granted
              </span>
            </div>
            {renderScopeTable("ORG", orgGrantGroups)}
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex flex-col-reverse gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2">
            {isDirty ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                <Undo2Icon className="size-4" />
                {t("discard_changes", { defaultValue: "Discard changes" })}
              </Button>
            ) : (
              <span className="text-small-2 text-muted-foreground">
                {t("no_unsaved_changes", {
                  defaultValue: "All changes are saved.",
                })}
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="default"
            loading={updateMutation.isPending}
            disabled={!isDirty || updateMutation.isPending}
            onClick={handleSave}
            className="w-full gap-2 sm:w-auto"
          >
            <SaveIcon className="size-4" />
            {t("save", { defaultValue: "Save permissions" })}
          </Button>
        </div>
      </section>
    </div>
  )
}
