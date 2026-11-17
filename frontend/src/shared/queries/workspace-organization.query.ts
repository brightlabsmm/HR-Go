import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getWorkspaceOrganization,
  updateWorkspaceOrganization,
  type UpdateWorkspaceOrganizationInput,
} from "@/shared/services/workspace-organization.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const workspaceOrganizationKeys = {
  all: ["workspace-organization"] as const,
  settings: () => [...workspaceOrganizationKeys.all, "settings"] as const,
}

export function useWorkspaceOrganizationQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: workspaceOrganizationKeys.settings(),
    queryFn: () => getWorkspaceOrganization(),
    enabled: Boolean(accessToken),
  })
}

export function useUpdateWorkspaceOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateWorkspaceOrganizationInput) =>
      updateWorkspaceOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceOrganizationKeys.all,
      })
    },
  })
}
