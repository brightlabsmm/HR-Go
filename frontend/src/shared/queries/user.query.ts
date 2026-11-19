import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { authKeys } from "@/shared/queries/auth.query"
import {
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  reactivateUser,
  replaceUserRoles,
  updateUser,
  type CreatePlatformUserInput,
  type UpdatePlatformUserInput,
  type UserListParams,
} from "@/shared/services/user.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: UserListParams) =>
    [...userKeys.lists(), params ?? {}] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export function useUsersQuery(params?: UserListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useUserQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePlatformUserInput) => createUser(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdatePlatformUserInput
    }) => updateUser(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useReplaceUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      replaceUserRoles(id, roleIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
      void queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useDeactivateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useReactivateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reactivateUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
