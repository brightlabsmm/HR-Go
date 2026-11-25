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
import { Switch } from "@/components/ui/switch"
import { PAGE_PARAM, PAGE_SIZE_PARAM } from "@/constants/pagination"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useCreateLeaveTypeMutation,
  useLeaveRequestsQuery,
  useLeaveTypesQuery,
  useReviewLeaveRequestMutation,
} from "@/shared/queries/leave.query"
import type { LeaveRequestItem } from "@/shared/services/leave.service"
import { toast } from "@/shared/stores/toast.store"
import { formatDate } from "@/util/format-date"
import { parsePageParam, parsePageSizeParam } from "@/util/pagination"

const col = createDataTableColumns<LeaveRequestItem>()

export function LeaveListPage() {
  const { i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const canManage = can("org.leave.manage")
  const canApprove = can("org.leave.approve")

  const status = searchParams.get("status") ?? undefined
  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const pageSize = parsePageSizeParam(searchParams.get(PAGE_SIZE_PARAM))

  const typesQuery = useLeaveTypesQuery()
  const requestsQuery = useLeaveRequestsQuery({ page, pageSize, status })
  const createTypeMut = useCreateLeaveTypeMutation()
  const reviewMut = useReviewLeaveRequestMutation()

  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [allowance, setAllowance] = useState("10")
  const [requiresBalance, setRequiresBalance] = useState(true)

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
    col.accessor("leaveTypeName", {
      header: "Leave Type",
      enableSorting: false,
      cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
    }),
    col.accessor("startDate", {
      header: "Period",
      enableSorting: false,
      cell: ({ row }) =>
        `${formatDate(row.original.startDate, i18n.language)} – ${formatDate(row.original.endDate, i18n.language)}`,
    }),
    col.accessor("requestedDays", {
      header: "Days",
      enableSorting: false,
      cell: ({ getValue }) => `${getValue()}d`,
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
                    onSuccess: () => toast.success("Leave request approved."),
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
                    onSuccess: () => toast.success("Leave request rejected."),
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
        title="Leave Management"
        description="Configure leave types, track employee requests, and review approvals"
        actions={
          canManage ? (
            <Button type="button" onClick={() => setShowTypeDialog(true)}>
              <PlusIcon className="size-4" />
              Add Leave Type
            </Button>
          ) : null
        }
      />

      {(typesQuery.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(typesQuery.data ?? []).map((lt) => (
            <Badge key={lt.id} variant="secondary" className="px-3 py-1 text-xs">
              {lt.name} ({lt.code}) ·{" "}
              {lt.requiresBalance ? `${lt.annualAllowance}d/yr` : "Untracked"}
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
                { value: "CANCELLED", label: "Cancelled" },
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
            title="No leave requests"
            description="Employee leave requests submitted via web or mobile will appear here."
          />
        ) : (
          <DataTable
            tableId="leave-requests"
            columns={columns}
            data={rows}
            getRowId={(r) => r.id}
            label="Leave Requests"
          />
        )}
      </ListCard>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Leave Type</DialogTitle>
            <DialogDescription>Add a leave category and default annual quota.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Code</Label>
              <Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ANNUAL" />
            </div>
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual Leave" />
            </div>
            <div>
              <Label>Annual Allowance (Days)</Label>
              <Input type="number" className="mt-1" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label>Track Leave Balance</Label>
              <Switch checked={requiresBalance} onCheckedChange={setRequiresBalance} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
            <Button
              loading={createTypeMut.isPending}
              disabled={!code.trim() || !name.trim()}
              onClick={() =>
                createTypeMut.mutate(
                  {
                    code: code.trim(),
                    name: name.trim(),
                    annualAllowance: Number(allowance) || 0,
                    requiresBalance,
                    isPaid: true,
                  },
                  {
                    onSuccess: () => {
                      setShowTypeDialog(false)
                      setCode("")
                      setName("")
                      toast.success("Leave type created.")
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Create Leave Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
