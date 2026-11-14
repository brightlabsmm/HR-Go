import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createOrganization,
  getOrganization,
  listOrganizations,
  updateOrganization,
  updateOrganizationStatus,
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
