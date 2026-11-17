import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createOrganization,
  createOrganizationAdminAccount,
  getOrganization,
  listOrganizationAdminAccounts,
  listOrganizations,
  updateOrganization,
  updateOrganizationStatus,
  type CreateAdminAccountInput,
  type CreateOrganizationInput,
  type OrganizationListParams,
  type UpdateOrganizationInput,
  type UpdateOrganizationStatusInput,
} from "@/shared/services/organization.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
  list: (params?: OrganizationListParams) =>
    [...organizationKeys.lists(), params ?? {}] as const,
  details: () => [...organizationKeys.all, "detail"] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  adminAccounts: (id: string) => [...organizationKeys.detail(id), "adminAccounts"] as const,
}

export function useOrganizationsQuery(params?: OrganizationListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: () => listOrganizations(params),
    enabled: Boolean(accessToken),
  })
}

export function useOrganizationQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    },
  })
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateOrganizationInput
    }) => updateOrganization(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      })
    },
  })
}

export function useUpdateOrganizationStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateOrganizationStatusInput
    }) => updateOrganizationStatus(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      })
    },
  })
}

export function useOrganizationAdminAccountsQuery(organizationId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: organizationKeys.adminAccounts(organizationId),
    queryFn: () => listOrganizationAdminAccounts(organizationId),
    enabled: Boolean(accessToken && organizationId),
  })
}

export function useCreateOrganizationAdminAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      input,
    }: {
      organizationId: string
      input: CreateAdminAccountInput
    }) => createOrganizationAdminAccount(organizationId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.adminAccounts(variables.organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.organizationId),
      })
    },
  })
}
