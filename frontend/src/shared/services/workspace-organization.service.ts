import { apiClient } from "@/app/api/client"
import { unwrap } from "@/app/api/http"
import { workspacePath } from "@/app/api/paths"

export interface WorkspaceOrganizationSettings {
  id: string
  organizationCode: string
  legalName: string
  displayName: string
  contactEmail: string
  contactPhone: string
  country: string
  address: string
  status: string
  branchCodeFormat: string
  departmentCodeFormat: string
  createdAt: string
  updatedAt: string
}

export interface UpdateWorkspaceOrganizationInput {
  displayName?: string
  contactEmail?: string
  contactPhone?: string
  country?: string
  address?: string
  branchCodeFormat?: string
  departmentCodeFormat?: string
}

export function getWorkspaceOrganization() {
  return unwrap<WorkspaceOrganizationSettings>(
    apiClient.get(workspacePath("/organization"))
  )
}

export function updateWorkspaceOrganization(
  input: UpdateWorkspaceOrganizationInput
) {
  return unwrap<WorkspaceOrganizationSettings>(
    apiClient.patch(workspacePath("/organization"), input)
  )
}
