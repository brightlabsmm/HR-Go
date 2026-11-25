import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  listAuditLogs,
  type AuditLogQueryParams,
} from "@/shared/services/audit-log.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params?: AuditLogQueryParams) =>
    [...auditLogKeys.all, params ?? {}] as const,
}

export function useAuditLogsQuery(params?: AuditLogQueryParams) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => listAuditLogs(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}
