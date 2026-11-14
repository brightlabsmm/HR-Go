import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery } from "@/util/list-query"

export type DepartmentStatus = "ACTIVE" | "INACTIVE"

export interface Department {
  id: string
  organizationId: string
  branchId: string | null
  departmentCode: string
  departmentName: string
  status: DepartmentStatus | string
  createdAt: string
  updatedAt: string
}

export interface DepartmentListParams {
  page?: number
  limit?: number
  branchId?: string
  status?: string
  search?: string
}

export interface DepartmentInput {
  departmentCode: string
  departmentName: string
  branchId?: string | null
}

export function listDepartments(params?: DepartmentListParams) {
  return unwrapPage<Department>(
    apiClient.get(workspacePath("/departments"), {
      params: toListQuery({
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: params?.status,
        branchId: params?.branchId,
      }),
    })
  )
}

export function getDepartment(id: string) {
  return unwrap<Department>(
    apiClient.get(workspacePath(`/departments/${id}`))
  )
}

export function createDepartment(input: DepartmentInput) {
  return unwrap<Department>(
    apiClient.post(workspacePath("/departments"), compactParams(input))
  )
}

export function updateDepartment(
  id: string,
  input: Partial<Omit<DepartmentInput, "departmentCode">>
) {
  return unwrap<Department>(
    apiClient.patch(workspacePath(`/departments/${id}`), compactParams(input))
  )
}

export function deactivateDepartment(id: string) {
  return unwrap<Department>(
    apiClient.post(workspacePath(`/departments/${id}/deactivate`))
  )
}
