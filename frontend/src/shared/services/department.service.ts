import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery, type ListQueryParams } from "@/util/list-query"

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

export interface DepartmentListParams extends ListQueryParams {
  branchId?: string
}

export interface DepartmentInput {
  departmentName: string
  branchId?: string | null
}

export function listDepartments(params?: DepartmentListParams) {
  return unwrapPage<Department>(
    apiClient.get(workspacePath("/departments"), {
      params: toListQuery(params),
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
  input: Partial<DepartmentInput>
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
