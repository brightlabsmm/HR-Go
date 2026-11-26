import { useState } from "react"
import { EyeIcon } from "lucide-react"
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
import { ToneBadge, type BadgeTone } from "@/components/common/tone-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { useAuditLogsQuery } from "@/shared/queries/audit-log.query"
import type { AuditLogEntry } from "@/shared/services/audit-log.service"
import { formatDateTime } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

const col = createDataTableColumns<AuditLogEntry>()

function actionTone(action: string): BadgeTone {
  const upper = action.toUpperCase()
  if (
    upper.includes("CREATE") ||
    upper.includes("APPROVE") ||
    upper.includes("REACTIVATE")
  ) {
    return "success"
  }
  if (
    upper.includes("DEACTIVATE") ||
    upper.includes("DELETE") ||
    upper.includes("REJECT")
  ) {
    return "destructive"
  }
  if (
    upper.includes("UPDATE") ||
    upper.includes("REVIEW") ||
    upper.includes("ASSIGN")
  ) {
    return "info"
  }
  return "neutral"
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" && !Array.isArray(val)
    ? (val as Record<string, unknown>)
    : null
}

function extractSummary(entry: AuditLogEntry): string | null {
  const src = asRecord(entry.newValues) ?? asRecord(entry.oldValues)
  if (src) {
    const labelKeys = [
      "branchName",
      "departmentName",
      "positionName",
      "fullName",
      "shiftName",
      "holidayName",
      "name",
      "documentName",
    ]
    const codeKeys = ["branchCode", "departmentCode", "positionCode", "employeeCode", "code"]
    const label = labelKeys.map((k) => src[k]).find((v) => typeof v === "string" && v.trim()) as string | undefined
    const code = codeKeys.map((k) => src[k]).find((v) => typeof v === "string" && v.trim()) as string | undefined
    if (label && code) return `${label} (${code})`
    if (label) return label
    if (code) return code
  }
  const details = asRecord(entry.details)
  if (details && typeof details.path === "string") {
    return details.path
  }
  return null
}

function formatJson(val: unknown): string {
  if (val == null) return ""
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

export function AuditLogListPage() {
  const { i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)

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
    col.display({
      id: "actor",
      header: "Actor",
      cell: ({ row }) => {
        const entry = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {entry.actorName || entry.actorType}
            </span>
            {(entry.actorCode || entry.actorName) && (
              <span className="text-xs text-muted-foreground">
                {entry.actorCode ? `${entry.actorCode} · ` : ""}
                {entry.actorType}
              </span>
            )}
          </div>
        )
      },
    }),
    col.accessor("action", {
      header: "Action",
      enableSorting: false,
      cell: ({ getValue }) => (
        <ToneBadge tone={actionTone(getValue())}>{getValue()}</ToneBadge>
      ),
    }),
    col.display({
      id: "target",
      header: "Entity / Target",
      cell: ({ row }) => {
        const entry = row.original
        const summary = extractSummary(entry)
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {entry.entityName}
              {summary ? ` — ${summary}` : ""}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {entry.entityId || "—"}
            </span>
          </div>
        )
      },
    }),
    col.accessor("clientIp", {
      header: "IP Address",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue() || "—"}
        </span>
      ),
    }),
    col.display({
      id: "inspect",
      header: "Details",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedEntry(row.original)}
        >
          <EyeIcon className="size-4" />
          View
        </Button>
      ),
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

      <Dialog
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry
                ? `${selectedEntry.action} · ${selectedEntry.entityName}`
                : "Audit Event"}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry
                ? `${formatDateTime(selectedEntry.createdAt, i18n.language)} · ${selectedEntry.actorName || selectedEntry.actorType}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto text-small-2">
              <div className="grid grid-cols-2 gap-3 rounded-md border border-hair bg-subtle/40 p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Actor</span>
                  <p className="font-medium text-foreground">
                    {selectedEntry.actorName || selectedEntry.actorType}
                    {selectedEntry.actorCode ? ` (${selectedEntry.actorCode})` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Entity ID</span>
                  <p className="font-mono text-xs text-foreground">
                    {selectedEntry.entityId || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">IP Address</span>
                  <p className="font-mono text-xs text-foreground">
                    {selectedEntry.clientIp || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Actor Type</span>
                  <p className="text-foreground">{selectedEntry.actorType}</p>
                </div>
              </div>

              {selectedEntry.oldValues != null && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Previous Values
                  </h3>
                  <pre className="overflow-x-auto rounded-md border border-hair bg-subtle p-3 font-mono text-xs text-foreground">
                    {formatJson(selectedEntry.oldValues)}
                  </pre>
                </div>
              )}

              {selectedEntry.newValues != null && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    New / Resulting Values
                  </h3>
                  <pre className="overflow-x-auto rounded-md border border-hair bg-subtle p-3 font-mono text-xs text-foreground">
                    {formatJson(selectedEntry.newValues)}
                  </pre>
                </div>
              )}

              {selectedEntry.details != null && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Request Details
                  </h3>
                  <pre className="overflow-x-auto rounded-md border border-hair bg-subtle p-3 font-mono text-xs text-foreground">
                    {formatJson(selectedEntry.details)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
