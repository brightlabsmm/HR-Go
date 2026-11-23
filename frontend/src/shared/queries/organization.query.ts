import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { Paginated } from "@/app/api/types"
import {
  createOrganization,
  createOrganizationAdminAccount,
  deleteOrganization,
  getOrganization,
  listOrganizationAdminAccounts,
  listOrganizations,
  updateOrganization,
  updateOrganizationStatus,
  type CreateAdminAccountInput,
  type CreateOrganizationInput,
  type Organization,
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
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  })
}

export function useOrganizationQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(accessToken && id),
    staleTime: 0,
    refetchOnMount: "always",
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: async (data) => {
      queryClient.setQueryData(organizationKeys.detail(data.id), data)
      queryClient.setQueriesData<Paginated<Organization>>(
        { queryKey: organizationKeys.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old
          const exists = old.items.some((item) => item.id === data.id)
          if (exists) return old
          return {
            ...old,
            items: [data, ...old.items],
            meta: {
              ...old.meta,
              totalItems: (old.meta?.totalItems ?? old.items.length) + 1,
            },
          }
        }
      )
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.all,
        refetchType: "all",
      })
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
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(
        organizationKeys.detail(variables.id),
        (old: Organization | undefined) => {
          if (!old) return data
          return { ...old, ...data }
        }
      )
      queryClient.setQueriesData<Paginated<Organization>>(
        { queryKey: organizationKeys.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === variables.id ? { ...item, ...data } : item
            ),
          }
        }
      )
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.all,
        refetchType: "all",
      })
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
        refetchType: "all",
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
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(
        organizationKeys.detail(variables.id),
        (old: Organization | undefined) => {
          if (!old) return data
          return { ...old, ...data, status: data.status, updatedAt: data.updatedAt }
        }
      )
      queryClient.setQueriesData<Paginated<Organization>>(
        { queryKey: organizationKeys.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === variables.id
                ? { ...item, ...data, status: data.status, updatedAt: data.updatedAt }
                : item
            ),
          }
        }
      )
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.all,
        refetchType: "all",
      })
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
        refetchType: "all",
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
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.adminAccounts(variables.organizationId),
        refetchType: "all",
      })
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.organizationId),
        refetchType: "all",
      })
    },
  })
}

export function useDeleteOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: organizationKeys.detail(id) })
      queryClient.setQueriesData<Paginated<Organization>>(
        { queryKey: organizationKeys.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old
          return {
            ...old,
            items: old.items.filter((item) => item.id !== id),
            meta: {
              ...old.meta,
              totalItems: Math.max(0, (old.meta?.totalItems ?? old.items.length) - 1),
            },
          }
        }
      )
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.all,
        refetchType: "all",
      })
    },
  })
}
