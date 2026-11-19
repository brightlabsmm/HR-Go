import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createPosition,
  deactivatePosition,
  getPosition,
  listPositions,
  updatePosition,
  type PositionInput,
  type PositionListParams,
} from "@/shared/services/position.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const positionKeys = {
  all: ["positions"] as const,
  lists: () => [...positionKeys.all, "list"] as const,
  list: (params?: PositionListParams) =>
    [...positionKeys.lists(), params ?? {}] as const,
  details: () => [...positionKeys.all, "detail"] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
}

export function usePositionsQuery(params?: PositionListParams) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: positionKeys.list(params),
    queryFn: () => listPositions(params),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  })
}

export function usePositionQuery(id: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => getPosition(id),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreatePositionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PositionInput) => createPosition(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.all })
    },
  })
}

export function useUpdatePositionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Omit<PositionInput, "positionCode">>
    }) => updatePosition(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.all })
    },
  })
}

export function useDeactivatePositionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deactivatePosition(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.all })
    },
  })
}
