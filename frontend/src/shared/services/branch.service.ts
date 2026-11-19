import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"
import { toListQuery } from "@/util/list-query"

export type BranchStatus = "ACTIVE" | "INACTIVE"

export interface Branch {
  id: string
  organizationId: string
  parentId: string | null
  branchCode: string
  branchName: string
  address?: string | null
  status: BranchStatus | string
  createdAt: string
  updatedAt: string
}

export interface BranchListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export interface BranchInput {
  branchName: string
  parentId?: string | null
  address?: string
}

export function listBranches(params?: BranchListParams) {
  return unwrapPage<Branch>(
    apiClient.get(workspacePath("/branches"), {
      params: toListQuery(params),
    })
  )
}

export function getBranch(id: string) {
  return unwrap<Branch>(apiClient.get(workspacePath(`/branches/${id}`)))
}

export function createBranch(input: BranchInput) {
  return unwrap<Branch>(apiClient.post(workspacePath("/branches"), input))
}

export function updateBranch(id: string, input: Partial<BranchInput>) {
  return unwrap<Branch>(apiClient.patch(workspacePath(`/branches/${id}`), input))
}

export function deactivateBranch(id: string) {
  return unwrap<Branch>(
    apiClient.post(workspacePath(`/branches/${id}/deactivate`))
  )
}
