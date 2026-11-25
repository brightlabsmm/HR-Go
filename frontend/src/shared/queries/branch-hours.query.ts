import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listBranchOperatingHours,
  upsertBranchOperatingHours,
  type OperatingHourInput,
} from "@/shared/services/branch-hours.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const branchHoursKeys = {
  all: ["branch-operating-hours"] as const,
  byBranch: (branchId: string) => [...branchHoursKeys.all, branchId] as const,
}

export function useBranchOperatingHoursQuery(branchId: string) {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: branchHoursKeys.byBranch(branchId),
    queryFn: () => listBranchOperatingHours(branchId),
    enabled: Boolean(accessToken && branchId),
  })
}

export function useUpsertBranchOperatingHoursMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      hours,
    }: {
      branchId: string
      hours: OperatingHourInput[]
    }) => upsertBranchOperatingHours(branchId, hours),
    onSuccess: (items, { branchId }) => {
      queryClient.setQueryData(branchHoursKeys.byBranch(branchId), items)
    },
  })
}
