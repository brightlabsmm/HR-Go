import { type ChangeEvent, useRef, useState } from "react"
import {
  AlertTriangleIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  UploadIcon,
} from "lucide-react"
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
import { TableSkeleton } from "@/components/common/table-skeleton"
import { type BadgeTone, ToneBadge } from "@/components/common/tone-badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePaginationQuery } from "@/shared/hooks/use-pagination-query"
import { usePermissions } from "@/shared/hooks/use-permissions"
import {
  useImportAttendanceCsvMutation,
  useImportBatchesQuery,
} from "@/shared/queries/attendance-import.query"
import { useBranchesQuery } from "@/shared/queries/branch.query"
import {
  exportAttendanceCsv,
  type AttendanceImportBatch,
} from "@/shared/services/attendance-import.service"
import { toast } from "@/shared/stores/toast.store"
import { formatDateTime } from "@/util/format-date"

const col = createDataTableColumns<AttendanceImportBatch>()

const IMPORT_TEMPLATE_HEADER =
  "employeeCode,attendanceDate,checkIn,checkOut,status,remarks"
const IMPORT_TEMPLATE_CSV = [
  IMPORT_TEMPLATE_HEADER,
  "EMP-001,2026-11-26,09:00,18:00,PRESENT,Regular shift",
].join("\n")

const EXPORT_STATUS_VALUES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "HALF_DAY",
  "EARLY_LEAVE",
  "ON_LEAVE",
  "HOLIDAY",
] as const

function batchStatusTone(status: string): BadgeTone {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "success"
    case "PARTIAL":
      return "warning"
    case "FAILED":
      return "destructive"
    default:
      return "neutral"
  }
}

function getCurrentMonthBounds() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, "0")
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  }
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function countCsvDataRows(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.length > 1 ? lines.length - 1 : 0
}

export function AttendanceImportPage() {
  const { t, i18n } = useTranslation("attendance")
  const { can } = usePermissions()
  const canCreate = can("org.attendance.create")
  const { page, limit } = usePaginationQuery()
  const batchesQuery = useImportBatchesQuery(page, limit)
  const branchesQuery = useBranchesQuery({ limit: 100 })
  const importMut = useImportAttendanceCsvMutation()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [fileRef, setFileRef] = useState("attendance-import.csv")
  const [csvContent, setCsvContent] = useState(`${IMPORT_TEMPLATE_HEADER}\n`)

  const defaultBounds = getCurrentMonthBounds()
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFrom, setExportFrom] = useState(defaultBounds.from)
  const [exportTo, setExportTo] = useState(defaultBounds.to)
  const [exportBranchId, setExportBranchId] = useState("all")
  const [exportStatus, setExportStatus] = useState("all")
  const [exporting, setExporting] = useState(false)

  const [errorBatch, setErrorBatch] = useState<AttendanceImportBatch | null>(
    null
  )

  function handleDownloadTemplate() {
    downloadCsvFile("attendance-import-template.csv", `${IMPORT_TEMPLATE_CSV}\n`)
    toast.success(t("imports.template_downloaded"))
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setFileRef(file.name)
    setCsvContent(text)
    const count = countCsvDataRows(text)
    toast.success(
      t("imports.import_dialog.file_loaded", { name: file.name, rows: count })
    )
    event.target.value = ""
  }

  async function handleExport() {
    setExporting(true)
    try {
      const from = exportFrom.trim() || undefined
      const to = exportTo.trim() || undefined
      const csv = await exportAttendanceCsv({
        from,
        to,
        branchId: exportBranchId === "all" ? undefined : exportBranchId,
        status: exportStatus === "all" ? undefined : exportStatus,
      })
      const suffix = from && to ? `-${from}-to-${to}` : ""
      downloadCsvFile(`attendance-export${suffix}.csv`, csv)
      setShowExportDialog(false)
      toast.success(t("imports.export_dialog.success"))
    } catch (err) {
      notifyApiError(err)
    } finally {
      setExporting(false)
    }
  }

  const branchItems = [
    { value: "all", label: t("imports.export_dialog.all_branches") },
    ...(branchesQuery.data?.items ?? []).map((b) => ({
      value: b.id,
      label: b.branchName,
    })),
  ]

  const statusItems = [
    { value: "all", label: t("all_status") },
    ...EXPORT_STATUS_VALUES.map((val) => ({
      value: val,
      label: t(`status.${val}`),
    })),
  ]

  const columns = col.columns([
    col.accessor("fileReference", {
      header: t("imports.columns.file"),
      enableSorting: false,
    }),
    col.accessor("totalRows", {
      header: t("imports.columns.total_rows"),
      enableSorting: false,
    }),
    col.accessor("successRows", {
      header: t("imports.columns.succeeded"),
      enableSorting: false,
    }),
    col.accessor("failedRows", {
      header: t("imports.columns.failed"),
      enableSorting: false,
    }),
    col.accessor("importStatus", {
      header: t("imports.columns.status"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue()
        return (
          <ToneBadge tone={batchStatusTone(val)} dot>
            {t(`imports.batch_status.${val}`, { defaultValue: val })}
          </ToneBadge>
        )
      },
    }),
    col.accessor("createdAt", {
      header: t("imports.columns.imported_at"),
      enableSorting: false,
      cell: ({ getValue }) => formatDateTime(getValue(), i18n.language),
    }),
    col.display({
      id: "errors",
      header: t("imports.columns.errors"),
      enableSorting: false,
      meta: { align: "end" },
      cell: ({ row }) => {
        const errors = row.original.errorSummary ?? []
        if (errors.length === 0) {
          return <span className="text-caption text-muted-foreground">—</span>
        }
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setErrorBatch(row.original)}
          >
            <AlertTriangleIcon className="size-3.5 text-amber-500" />
            {t("imports.errors_dialog.view", { count: errors.length })}
          </Button>
        )
      },
    }),
  ])

  const rows = batchesQuery.data?.items ?? []
  const detectedRows = countCsvDataRows(csvContent)

  return (
    <MotionStack className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title={t("imports.title")}
        description={t("imports.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <FileSpreadsheetIcon className="size-4" />
                {t("imports.download_template")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExportDialog(true)}
            >
              <DownloadIcon className="size-4" />
              {t("imports.export_csv")}
            </Button>
            {canCreate && (
              <Button type="button" onClick={() => setShowImportDialog(true)}>
                <UploadIcon className="size-4" />
                {t("imports.import_csv")}
              </Button>
            )}
          </div>
        }
      />

      {canCreate && (
        <div className="flex flex-col gap-2 rounded-xl border border-hair bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-small-1 font-medium text-foreground">
              {t("imports.guide_title")}
            </p>
            <p className="text-small-2 text-muted-foreground">
              {t("imports.guide_steps")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <DownloadIcon className="size-4" />
            {t("imports.download_template")}
          </Button>
        </div>
      )}

      <ListCard
        footer={
          <Pagination
            meta={batchesQuery.data?.meta}
            isDisabled={batchesQuery.isPending}
          />
        }
      >
        {batchesQuery.isPending ? (
          <TableSkeleton columns={7} />
        ) : rows.length === 0 ? (
          <PageEmptyState
            title={t("imports.empty.title")}
            description={t("imports.empty.description")}
          />
        ) : (
          <DataTable
            tableId="attendance-imports"
            columns={columns}
            data={rows}
            getRowId={(b) => b.id}
            label={t("imports.title")}
          />
        )}
      </ListCard>

      {/* Import Dialog: template download + CSV file upload + preview */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("imports.import_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("imports.import_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2 rounded-lg border border-hair bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-small-2 font-medium text-foreground">
                  {t("imports.import_dialog.step_template_label")}
                </p>
                <p className="text-caption text-muted-foreground">
                  {t("imports.import_dialog.step_template_hint")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <FileSpreadsheetIcon className="size-4" />
                {t("imports.download_template")}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("imports.import_dialog.upload_file")}</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => void handleFileSelect(e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-4" />
                  {t("imports.import_dialog.upload_button")}
                </Button>
                <span className="text-caption text-muted-foreground">
                  {t("imports.import_dialog.rows_detected", {
                    count: detectedRows,
                  })}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="import-file-ref">
                {t("imports.import_dialog.file_reference")}
              </Label>
              <Input
                id="import-file-ref"
                className="mt-1"
                value={fileRef}
                onChange={(e) => setFileRef(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="import-csv-content">
                {t("imports.import_dialog.csv_content")}
              </Label>
              <Textarea
                id="import-csv-content"
                rows={7}
                className="mt-1 font-mono text-xs"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="button"
              loading={importMut.isPending}
              disabled={!fileRef.trim() || detectedRows === 0}
              onClick={() =>
                importMut.mutate(
                  { fileReference: fileRef.trim(), csvContent },
                  {
                    onSuccess: (res) => {
                      setShowImportDialog(false)
                      toast.success(
                        t("imports.import_dialog.success", {
                          success: res.successRows,
                          total: res.totalRows,
                          status: t(`imports.batch_status.${res.importStatus}`, {
                            defaultValue: res.importStatus,
                          }),
                        })
                      )
                    },
                    onError: (err) => notifyApiError(err),
                  }
                )
              }
            >
              {t("imports.import_dialog.run")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog: standard filterable CSV export workflow */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("imports.export_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("imports.export_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp-from">
                  {t("imports.export_dialog.from_date")}
                </Label>
                <Input
                  id="exp-from"
                  type="date"
                  className="mt-1"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exp-to">
                  {t("imports.export_dialog.to_date")}
                </Label>
                <Input
                  id="exp-to"
                  type="date"
                  className="mt-1"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp-branch">
                  {t("imports.export_dialog.branch")}
                </Label>
                <Select
                  items={branchItems}
                  value={exportBranchId}
                  onValueChange={(val) => setExportBranchId(val ?? "all")}
                >
                  <SelectTrigger id="exp-branch" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branchItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="exp-status">
                  {t("imports.export_dialog.status")}
                </Label>
                <Select
                  items={statusItems}
                  value={exportStatus}
                  onValueChange={(val) => setExportStatus(val ?? "all")}
                >
                  <SelectTrigger id="exp-status" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="button"
              loading={exporting}
              onClick={() => void handleExport()}
            >
              <DownloadIcon className="size-4" />
              {t("imports.export_dialog.download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Row Errors Dialog */}
      <Dialog
        open={Boolean(errorBatch)}
        onOpenChange={(open) => {
          if (!open) setErrorBatch(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("imports.errors_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("imports.errors_dialog.description", {
                file: errorBatch?.fileReference ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-hair p-3">
            <ul className="space-y-2 text-small-2">
              {(errorBatch?.errorSummary ?? []).map((errItem, idx) => (
                <li
                  key={`${errItem.row}-${idx}`}
                  className="flex items-start gap-2 border-b border-hair pb-2 last:border-b-0 last:pb-0"
                >
                  <ToneBadge tone="destructive">
                    {t("imports.errors_dialog.row", { row: errItem.row })}
                  </ToneBadge>
                  <span className="text-foreground">{errItem.message}</span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setErrorBatch(null)}
            >
              {t("form.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MotionStack>
  )
}
