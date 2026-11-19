import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { createDataTableColumns, DataTable } from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { SearchBox } from "@/components/common/search-box"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { ToneBadge } from "@/components/common/tone-badge"
import { resolvePermissionGrouping } from "@/features/roles/group-permissions"
import { usePermissionLabels } from "@/features/roles/use-permission-labels"
import { useListSort } from "@/shared/hooks/use-list-sort"
import { usePermissionsQuery } from "@/shared/queries/role.query"

import type { Permission } from "@/shared/services/role.service"

const column = createDataTableColumns<Permission>()

export function PermissionListPage() {
  const { t } = useTranslation("roles")
  const { groupingLabel, permissionLabel } = usePermissionLabels()

  const [scopeFilter, setScopeFilter] = useState<string>("all")
  const [groupingFilter, setGroupingFilter] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const hasFilters =
    Boolean(search.trim()) || groupingFilter !== "all" || scopeFilter !== "all"

  function resetFilters() {
    setSearch("")
    setGroupingFilter("all")
    setScopeFilter("all")
  }
  const { sorting, setSorting, listSortParams } = useListSort()

  const permissionsQuery = usePermissionsQuery({
    ...listSortParams,
    limit: 100,
  })
  const rawPermissions = useMemo(
    () => permissionsQuery.data?.items ?? [],
    [permissionsQuery.data?.items]
  )

  const availableGroupings = useMemo(() => {
    const set = new Set<string>()
    for (const p of rawPermissions) {
      set.add(resolvePermissionGrouping(p))
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [rawPermissions])

  const filteredPermissions = useMemo(() => {
    return rawPermissions.filter((item) => {
      const grouping = resolvePermissionGrouping(item)
      const matchesScope =
        scopeFilter === "all" ||
        (item.scope && item.scope.toLowerCase() === scopeFilter.toLowerCase())
      const matchesGrouping =
        groupingFilter === "all" || grouping === groupingFilter.toLowerCase()

      const term = search.trim().toLowerCase()
      const label = permissionLabel(item).toLowerCase()
      const code = item.code.toLowerCase()
      const desc = (item.description ?? "").toLowerCase()
      const grp = grouping.toLowerCase()
      const matchesSearch =
        !term ||
        label.includes(term) ||
        code.includes(term) ||
        desc.includes(term) ||
        grp.includes(term)

      return matchesScope && matchesGrouping && matchesSearch
    })
  }, [rawPermissions, scopeFilter, groupingFilter, search, permissionLabel])

  const columns = useMemo(
    () =>
      column.columns([
        column.accessor("grouping", {
          header: t("columns.grouping", { defaultValue: "Grouping" }),
          enableSorting: true,
          cell: ({ row }) => {
            const grouping = resolvePermissionGrouping(row.original)
            return (
              <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-small-2 font-medium text-secondary">
                {groupingLabel(grouping)}
              </span>
            )
          },
        }),
        column.display({
          id: "permission",
          header: t("columns.permission", { defaultValue: "Permission" }),
          enableSorting: false,
          cell: ({ row }) => (
            <span className="font-normal text-foreground">
              {permissionLabel(row.original)}
            </span>
          ),
        }),
        column.accessor("code", {
          header: t("columns.code", { defaultValue: "Code" }),
          enableSorting: true,
          cell: ({ getValue }) => (
            <span className="font-mono text-small-2 text-muted-foreground">
              {getValue()}
            </span>
          ),
        }),
        column.accessor("scope", {
          header: t("columns.scope", { defaultValue: "Scope" }),
          enableSorting: true,
          cell: ({ getValue }) => {
            const scope = getValue() ?? "PLATFORM"
            return (
              <ToneBadge tone={scope === "PLATFORM" ? "brand" : "neutral"}>
                {scope}
              </ToneBadge>
            )
          },
        }),
        column.accessor("description", {
          header: t("columns.description", { defaultValue: "Description" }),
          enableSorting: false,
          cell: ({ getValue }) => (
            <span className="text-small-2 text-muted-foreground">
              {getValue() || "—"}
            </span>
          ),
        }),
      ]),
    [groupingLabel, permissionLabel, t]
  )

  function renderContent() {
    if (permissionsQuery.isPending) {
      return <TableSkeleton columns={5} rows={8} />
    }

    if (filteredPermissions.length === 0) {
      return (
        <PageEmptyState
          title={t("empty.permissions_title", { defaultValue: "No permissions found" })}
          description={t("empty.permissions_desc", {
            defaultValue: "Try adjusting your search or filters.",
          })}
        />
      )
    }

    return (
      <DataTable
        tableId="permissions"
        columns={columns}
        data={filteredPermissions}
        getRowId={(item) => item.id || item.code}
        label={t("permissions_table_label", { defaultValue: "Permissions catalogue" })}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    )
  }

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title={t("permissions_page_title", { defaultValue: "Permissions" })}
        description={t("permissions_page_subtitle", {
          defaultValue: "System permissions catalog organized by grouping.",
        })}
      />
      <ListCard
        toolbar={
          <FilterBar hasFilters={hasFilters} onReset={resetFilters}>
            <SearchBox
              value={search}
              onValueChange={setSearch}
              placeholder={t("search_placeholder", {
                defaultValue: "Search permissions...",
              })}
              className="w-80 max-w-full shrink-0"
            />
            <FilterSelect
              value={groupingFilter}
              label={t("columns.grouping", { defaultValue: "Grouping" })}
              onValueChange={setGroupingFilter}
              items={[
                {
                  value: "all",
                  label: t("filters.all_groupings", {
                    defaultValue: "All groupings",
                  }),
                },
                ...availableGroupings.map((g) => ({
                  value: g,
                  label: groupingLabel(g),
                })),
              ]}
            />
            <FilterSelect
              value={scopeFilter}
              label={t("columns.scope", { defaultValue: "Scope" })}
              onValueChange={setScopeFilter}
              items={[
                {
                  value: "all",
                  label: t("filters.all_scopes", {
                    defaultValue: "All scopes",
                  }),
                },
                { value: "PLATFORM", label: "PLATFORM" },
                { value: "ORG", label: "ORG" },
              ]}
            />
          </FilterBar>
        }
      >
        {renderContent()}
      </ListCard>
    </MotionStack>
  )
}
