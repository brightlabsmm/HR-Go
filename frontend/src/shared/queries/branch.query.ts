import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createBranch,
  deactivateBranch,
  getBranch,
  listBranches,
  updateBranch,
  type BranchInput,
  type BranchListParams,
} from "@/shared/services/branch.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const branchKeys = {
  all: ["branches"] as const,
  lists: () => [...branchKeys.all, "list"] as const,
  list: (params?: BranchListParams) =>
    [...branchKeys.lists(), params ?? {}] as const,
  details: () => [...branchKeys.all, "detail"] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
}

export function useBranchesQuery(params?: BranchListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: branchKeys.list(params),
    queryFn: () => listBranches(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function useBranchQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => getBranch(id),
    enabled: Boolean(accessToken && id),
    meta: {
      skipErrorToast: true,
    },
  })
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BranchInput) => createBranch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<BranchInput>
    }) => updateBranch(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: branchKeys.all })
      void queryClient.invalidateQueries({
        queryKey: branchKeys.detail(variables.id),
      })
    },
  })
}

export function useDeactivateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivateBranch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}
