import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { attendanceKeys } from "@/shared/queries/attendance.query"
import {
  importAttendanceCsv,
  listImportBatches,
} from "@/shared/services/attendance-import.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const importBatchKeys = {
  all: ["attendance-import-batches"] as const,
  list: (page = 1, pageSize = 20) =>
    [...importBatchKeys.all, page, pageSize] as const,
}

export function useImportBatchesQuery(page = 1, pageSize = 20) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: importBatchKeys.list(page, pageSize),
    queryFn: () => listImportBatches({ page, pageSize }),
    enabled: Boolean(accessToken),
  })
}

export function useImportAttendanceCsvMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: importAttendanceCsv,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: importBatchKeys.all })
      void qc.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}
