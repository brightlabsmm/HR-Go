import { apiClient } from "@/app/api/client"
import { unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"

export interface AuditLogEntry {
  id: string
  organizationId?: string | null
  actorId?: string | null
  actorType: string
  action: string
  entityName: string
  entityId?: string | null
  oldValues?: unknown
  newValues?: unknown
  details?: unknown
  clientIp?: string | null
  createdAt: string
}

export interface AuditLogQueryParams {
  page?: number
  pageSize?: number
  entityName?: string
  action?: string
}

export function listAuditLogs(params?: AuditLogQueryParams) {
  return unwrapPage<AuditLogEntry>(
    apiClient.get(workspacePath("/audit-logs"), {
      params: compactParams(params ?? {}),
    })
  )
}
