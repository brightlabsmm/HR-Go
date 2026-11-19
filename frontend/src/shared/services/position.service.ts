import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery } from "@/util/list-query"

export type PositionStatus = "ACTIVE" | "INACTIVE"

export interface Position {
  id: string
  organizationId: string
  departmentId: string | null
  positionCode: string
  positionName: string
  status: PositionStatus | string
  createdAt: string
  updatedAt: string
}

export interface PositionListParams {
  page?: number
  limit?: number
  departmentId?: string
  status?: string
  search?: string
}

export interface PositionInput {
  positionCode: string
  positionName: string
  departmentId?: string | null
}

export function listPositions(params?: PositionListParams) {
  return unwrapPage<Position>(
    apiClient.get(workspacePath("/positions"), {
      params: toListQuery({
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: params?.status,
        departmentId: params?.departmentId,
      }),
    })
  )
}

export function getPosition(id: string) {
  return unwrap<Position>(apiClient.get(workspacePath(`/positions/${id}`)))
}

export function createPosition(input: PositionInput) {
  return unwrap<Position>(
    apiClient.post(workspacePath("/positions"), compactParams(input))
  )
}

export function updatePosition(
  id: string,
  input: Partial<Omit<PositionInput, "positionCode">>
) {
  return unwrap<Position>(
    apiClient.patch(workspacePath(`/positions/${id}`), compactParams(input))
  )
}

export function deactivatePosition(id: string) {
  return unwrap<Position>(
    apiClient.post(workspacePath(`/positions/${id}/deactivate`))
  )
}
