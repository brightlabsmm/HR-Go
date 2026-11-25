import { useState } from "react"
import { CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { notifyApiError } from "@/app/api/feedback"
import {
  createDataTableColumns,
  DataTable,
} from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { FilterSelect } from "@/components/common/filter-select"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useCreateOvertimeCategoryMutation,
  useOvertimeCategoriesQuery,
  useOvertimeRequestsQuery,
  useReviewOvertimeRequestMutation,
} from "@/shared/queries/overtime.query"
import type { OvertimeRequestItem } from "@/shared/services/overtime.service"
import { toast } from "@/shared/stores/toast.store"
import { formatDate } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

const col = createDataTableColumns<OvertimeRequestItem>()

export function OvertimeListPage() {
  const { i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const canManage = can("org.overtime.manage")
  const canApprove = can("org.overtime.approve")

  const status = searchParams.get("status") ?? undefined
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const pageSize = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const catsQuery = useOvertimeCategoriesQuery()
  const requestsQuery = useOvertimeRequestsQuery({ page, pageSize, status })
  const createCatMut = useCreateOvertimeCategoryMutation()
  const reviewMut = useReviewOvertimeRequestMutation()

  const [showCatDialog, setShowCatDialog] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [multiplier, setMultiplier] = useState("1.5")

  function patchStatus(val: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!val || val === "all") {
      next.delete("status")
    } else {
      next.set("status", val)
    }
    next.delete(PAGE_PARAM)
    setSearchParams(next)
  }

  const columns = col.columns([
    col.accessor("employeeName", {
      header: "Employee",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">
            {row.original.employeeName || row.original.employeeId}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.employeeCode}
          </div>
        </div>
      ),
    }),
    col.accessor("categoryName", {
      header: "Category",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.categoryName} ({row.original.multiplier}x)
        </Badge>
      ),
    }),
    col.accessor("workDate", {
      header: "Work Date",
      enableSorting: false,
      cell: ({ getValue }) => formatDate(getValue(), i18n.language),
    }),
    col.accessor("requestedMinutes", {
      header: "Duration",
      enableSorting: false,
      cell: ({ row }) =>
        `${row.original.startTime}–${row.original.endTime} (${Math.floor(row.original.requestedMinutes / 60)}h ${row.original.requestedMinutes % 60}m)`,
    }),
    col.accessor("reason", {
      header: "Reason",
      enableSorting: false,
    }),
    col.accessor("requestStatus", {
      header: "Status",
      enableSorting: false,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    col.display({
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { align: "end" },
      cell: ({ row }) => {
        if (row.original.requestStatus !== "PENDING" || !canApprove) {
          return "—"
        }
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              disabled={reviewMut.isPending}
              onClick={() =>
                reviewMut.mutate(
                  { id: row.original.id, decision: "APPROVED" },
                  {
                    onSuccess: () => toast.success("Overtime request approved."),
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              <CheckIcon className="size-4 text-emerald-600" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={reviewMut.isPending}
              onClick={() =>
                reviewMut.mutate(
                  { id: row.original.id, decision: "REJECTED" },
                  {
                    onSuccess: () => toast.success("Overtime request rejected."),
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              <XIcon className="size-4 text-destructive" />
            </Button>
          </div>
        )
      },
    }),
  ])

  const rows = requestsQuery.data?.items ?? []

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title="Overtime Management"
        description="Manage overtime categories, rate multipliers, and employee overtime requests"
        actions={
          canManage ? (
            <Button type="button" onClick={() => setShowCatDialog(true)}>
              <PlusIcon className="size-4" />
              Add Category
            </Button>
          ) : null
        }
      />

      {(catsQuery.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(catsQuery.data ?? []).map((cat) => (
            <Badge key={cat.id} variant="secondary" className="px-3 py-1 text-xs">
              {cat.name} ({cat.code}) · {cat.rateMultiplier}x
            </Badge>
          ))}
        </div>
      )}

      <ListCard
        toolbar={
          <FilterBar
            hasFilters={Boolean(status)}
            onReset={() => setSearchParams(new URLSearchParams())}
          >
            <FilterSelect
              items={[
                { value: "all", label: "All status" },
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
              value={status ?? "all"}
              label="All status"
              onValueChange={patchStatus}
              className="w-40"
            />
          </FilterBar>
        }
        footer={
          <Pagination
            meta={requestsQuery.data?.meta}
            isDisabled={requestsQuery.isPending}
          />
        }
      >
        {requestsQuery.isPending ? (
          <TableSkeleton columns={7} />
        ) : rows.length === 0 ? (
          <PageEmptyState
            title="No overtime requests"
            description="Employee overtime requests submitted via web or mobile will appear here."
          />
        ) : (
          <DataTable
            tableId="overtime-requests"
            columns={columns}
            data={rows}
            getRowId={(r) => r.id}
            label="Overtime Requests"
          />
        )}
      </ListCard>

      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Overtime Category</DialogTitle>
            <DialogDescription>Configure overtime multiplier and daily bounds.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Code</Label>
              <Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WEEKDAY_OT" />
            </div>
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekday Overtime" />
            </div>
            <div>
              <Label>Rate Multiplier</Label>
              <Input type="number" step="0.1" className="mt-1" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>Cancel</Button>
            <Button
              loading={createCatMut.isPending}
              disabled={!code.trim() || !name.trim()}
              onClick={() =>
                createCatMut.mutate(
                  {
                    code: code.trim(),
                    name: name.trim(),
                    rateMultiplier: Number(multiplier) || 1.5,
                    minMinutes: 30,
                    maxDailyMinutes: 480,
                  },
                  {
                    onSuccess: () => {
                      setShowCatDialog(false)
                      setCode("")
                      setName("")
                      toast.success("Overtime category created.")
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
