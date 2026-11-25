import { useState } from "react"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { notifyApiError } from "@/app/api/feedback"
import {
  createDataTableColumns,
  DataTable,
} from "@/components/common/data-table"
import { ListCard } from "@/components/common/list-card"
import { MotionStack } from "@/components/common/motion-stack"
import { PageEmptyState } from "@/components/common/page-empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Pagination } from "@/components/common/pagination"
import { StatusBadge } from "@/components/common/status-badge"
import { TableSkeleton } from "@/components/common/table-skeleton"
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
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useImportAttendanceCsvMutation,
  useImportBatchesQuery,
} from "@/shared/queries/attendance-import.query"
import {
  exportAttendanceCsv,
  type AttendanceImportBatch,
} from "@/shared/services/attendance-import.service"
import { toast } from "@/shared/stores/toast.store"
import { formatDateTime } from "@/util/format-date"

const col = createDataTableColumns<AttendanceImportBatch>()

export function AttendanceImportPage() {
  const { i18n } = useTranslation()
  const { can } = usePermissions()
  const canCreate = can("org.attendance.create")
  const [page] = useState(1)
  const batchesQuery = useImportBatchesQuery(page, 20)
  const importMut = useImportAttendanceCsvMutation()

  const [showDialog, setShowDialog] = useState(false)
  const [fileRef, setFileRef] = useState("attendance-import.csv")
  const [csvContent, setCsvContent] = useState(
    "employeeCode,attendanceDate,checkIn,checkOut,status,remarks\n"
  )
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const csv = await exportAttendanceCsv()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "attendance-export.csv"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Attendance CSV exported.")
    } catch (err) {
      notifyApiError(err)
    } finally {
      setExporting(false)
    }
  }

  const columns = col.columns([
    col.accessor("fileReference", {
      header: "File",
      enableSorting: false,
    }),
    col.accessor("totalRows", {
      header: "Total Rows",
      enableSorting: false,
    }),
    col.accessor("successRows", {
      header: "Succeeded",
      enableSorting: false,
    }),
    col.accessor("failedRows", {
      header: "Failed",
      enableSorting: false,
    }),
    col.accessor("importStatus", {
      header: "Status",
      enableSorting: false,
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    col.accessor("createdAt", {
      header: "Imported At",
      enableSorting: false,
      cell: ({ getValue }) => formatDateTime(getValue(), i18n.language),
    }),
  ])

  const rows = batchesQuery.data?.items ?? []

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-8">
      <PageHeader
        title="Attendance Import & Export"
        description="Bulk import attendance logs from CSV and export attendance reports"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              loading={exporting}
              onClick={() => void handleExport()}
            >
              <DownloadIcon className="size-4" />
              Export CSV
            </Button>
            {canCreate && (
              <Button type="button" onClick={() => setShowDialog(true)}>
                <UploadIcon className="size-4" />
                Import CSV
              </Button>
            )}
          </div>
        }
      />

      <ListCard
        footer={
          <Pagination
            meta={batchesQuery.data?.meta}
            isDisabled={batchesQuery.isPending}
          />
        }
      >
        {batchesQuery.isPending ? (
          <TableSkeleton columns={6} />
        ) : rows.length === 0 ? (
          <PageEmptyState
            title="No CSV import batches yet"
            description="Upload a CSV file or paste CSV rows to bulk import attendance records."
          />
        ) : (
          <DataTable
            tableId="attendance-imports"
            columns={columns}
            data={rows}
            getRowId={(b) => b.id}
            label="Import Batches"
          />
        )}
      </ListCard>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import Attendance CSV</DialogTitle>
            <DialogDescription>
              Required headers: employeeCode, attendanceDate (YYYY-MM-DD), checkIn, checkOut, status, remarks.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label>Batch File Reference</Label>
              <Input
                className="mt-1"
                value={fileRef}
                onChange={(e) => setFileRef(e.target.value)}
              />
            </div>
            <div>
              <Label>CSV Content</Label>
              <Textarea
                rows={7}
                className="mt-1 font-mono text-xs"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              loading={importMut.isPending}
              disabled={!fileRef.trim() || !csvContent.trim()}
              onClick={() =>
                importMut.mutate(
                  { fileReference: fileRef.trim(), csvContent },
                  {
                    onSuccess: (res) => {
                      setShowDialog(false)
                      toast.success(
                        `Imported ${res.successRows}/${res.totalRows} rows (${res.importStatus}).`
                      )
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              Run Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
