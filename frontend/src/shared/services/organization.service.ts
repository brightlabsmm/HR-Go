import { apiClient } from "@/app/api/client"
import { unwrap, unwrapEmpty, unwrapPage } from "@/app/api/http"
import { controlPath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery } from "@/util/list-query"

export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED"

export interface Organization {
  id: string
  organizationCode: string
  legalName: string
  displayName: string
  contactEmail?: string | null
  contactPhone?: string | null
  country?: string | null
  address?: string | null
  status: OrganizationStatus | string
  createdAt: string
  updatedAt: string
}

export interface OrganizationListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  organizationCode?: string
}

export interface CreateOrganizationInput {
  organizationCode: string
  legalName: string
  displayName: string
  contactEmail: string
  contactPhone: string
  country: string
  address: string
}

export interface UpdateOrganizationInput {
  organizationCode?: string
  legalName?: string
  displayName?: string
  contactEmail?: string
  contactPhone?: string
  country?: string
  address?: string
}

export interface UpdateOrganizationStatusInput {
  status: OrganizationStatus
  confirmation: boolean
  reason?: string
}

export interface CreateAdminAccountInput {
  firstName: string
  lastName: string
  email?: string
  employeeCode: string
  password: string
}

export interface AdminAccount {
  id: string
  organizationId: string
  employeeId: string
  identifier: string
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  roleCode: string
  roleName: string
  status: string
  lastLoginAt?: string | null
  createdAt: string
}

export function listOrganizations(params?: OrganizationListParams) {
  return unwrapPage<Organization>(
    apiClient.get(controlPath("/organizations"), {
      params: toListQuery(params),
    })
  )
}

export function createOrganization(input: CreateOrganizationInput) {
  return unwrap<Organization>(
    apiClient.post(controlPath("/organizations"), input)
  )
}

export function getOrganization(id: string) {
  return unwrap<Organization>(
    apiClient.get(controlPath(`/organizations/${id}`))
  )
}

export function updateOrganization(id: string, input: UpdateOrganizationInput) {
  return unwrap<Organization>(
    apiClient.patch(controlPath(`/organizations/${id}`), input)
  )
}

export function updateOrganizationStatus(
  id: string,
  input: UpdateOrganizationStatusInput
) {
  return unwrap<Organization>(
    apiClient.post(
      controlPath(`/organizations/${id}/status`),
      compactParams(input)
    )
  )
}

export function createOrganizationAdminAccount(
  organizationId: string,
  input: CreateAdminAccountInput
) {
  return unwrap<AdminAccount>(
    apiClient.post(
      controlPath(`/organizations/${organizationId}/admin-account`),
      compactParams(input)
    )
  )
}

export function listOrganizationAdminAccounts(organizationId: string) {
  return unwrap<AdminAccount[]>(
    apiClient.get(controlPath(`/organizations/${organizationId}/admin-accounts`))
  )
}

export function deleteOrganization(id: string) {
  return unwrapEmpty(apiClient.delete(controlPath(`/organizations/${id}`)))
}
