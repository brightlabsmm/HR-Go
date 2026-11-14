import { apiClient } from "@/app/api/client"
import { unwrap, unwrapPage } from "@/app/api/http"
import { controlPath } from "@/app/api/paths"
import { compactParams } from "@/util/compact-params"
import { toListQuery } from "@/util/list-query"

export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED"

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
  contactEmail?: string
  contactPhone?: string
  country?: string
  address?: string
}

export interface UpdateOrganizationInput {
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
