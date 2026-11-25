import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import {
  createDataTableColumns,
  DataTable,
} from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useAuditLogsQuery } from "@/shared/queries/audit-log.query"
import type { AuditLogEntry } from "@/shared/services/audit-log.service"
import { formatDateTime } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

const col = createDataTableColumns<AuditLogEntry>()

export function AuditLogListPage() {
  const { i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const entityName = searchParams.get("entityName") ?? undefined
  const action = searchParams.get("action") ?? undefined
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const pageSize = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const logsQuery = useAuditLogsQuery({
    page,
    pageSize,
    entityName,
    action,
  })

  function patch(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  const columns = col.columns([
    col.accessor("createdAt", {
      header: "Timestamp",
      enableSorting: false,
      cell: ({ getValue }) => formatDateTime(getValue(), i18n.language),
    }),
    col.accessor("action", {
      header: "Action",
      enableSorting: false,
      cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
    }),
    col.accessor("entityName", {
      header: "Entity",
      enableSorting: false,
    }),
    col.accessor("entityId", {
      header: "Entity ID",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue() || "—"}
        </span>
      ),
    }),
    col.accessor("actorType", {
      header: "Actor Type",
      enableSorting: false,
    }),
    col.accessor("clientIp", {
      header: "IP Address",
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "—",
    }),
  ])

  const rows = logsQuery.data?.items ?? []

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title="Audit Logs"
        description="Chronological activity trail of workspace configuration and workforce changes"
      />
      <ListCard
        toolbar={
          <FilterBar
            hasFilters={Boolean(entityName || action)}
            onReset={resetFilters}
          >
            <div className="w-52">
              <Input
                placeholder="Filter by entity..."
                value={entityName ?? ""}
                onChange={(e) => patch("entityName", e.target.value || null)}
                className="h-9"
              />
            </div>
            <div className="w-52">
              <Input
                placeholder="Filter by action..."
                value={action ?? ""}
                onChange={(e) => patch("action", e.target.value || null)}
                className="h-9"
              />
            </div>
          </FilterBar>
        }
        footer={
          <Pagination
            meta={logsQuery.data?.meta}
            isDisabled={logsQuery.isPending}
          />
        }
      >
        {logsQuery.isPending ? (
          <TableSkeleton columns={6} />
        ) : rows.length === 0 ? (
          <PageEmptyState
            title="No audit events found"
            description="Mutations in workspace modules will appear here chronologically."
          />
        ) : (
          <DataTable
            tableId="audit-logs"
            columns={columns}
            data={rows}
            getRowId={(r) => r.id}
            label="Audit Logs"
          />
        )}
      </ListCard>
    </MotionStack>
  )
}
