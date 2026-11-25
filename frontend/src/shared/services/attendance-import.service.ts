import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"

export interface ImportBatchError {
  row: number
  message: string
}

export interface AttendanceImportBatch {
  id: string
  organizationId: string
  importedByAccountId?: string | null
  fileReference: string
  totalRows: number
  successRows: number
  failedRows: number
  importStatus: string
  errorSummary?: ImportBatchError[]
  createdAt: string
}

export function listImportBatches(params?: { page?: number; pageSize?: number }) {
  return unwrapPage<AttendanceImportBatch>(
    apiClient.get(workspacePath("/attendance/imports"), {
      params: compactParams(params ?? {}),
    })
  )
}

export function importAttendanceCsv(input: {
  fileReference: string
  csvContent: string
}) {
  return unwrap<AttendanceImportBatch>(
    apiClient.post(workspacePath("/attendance/imports"), input)
  )
}

export async function exportAttendanceCsv(params?: {
  from?: string
  to?: string
  status?: string
}) {
  const res = await apiClient.get<string>(workspacePath("/attendance/export"), {
    params: compactParams(params ?? {}),
    responseType: "text",
  })
  return res.data
}
