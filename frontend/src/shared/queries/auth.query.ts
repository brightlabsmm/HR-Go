import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getCurrentUser,
  login,
  logout,
  type AuthSession,
  type LoginInput,
} from "@/shared/services/auth.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

function applySession(session: AuthSession) {
  useAuthStore.getState().setSession({
    accessToken: session.accessToken,
  })
}

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    meta: { skipErrorToast: true, skipSuccessToast: true },
    onSuccess: (session) => {
      applySession(session)
      void queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    meta: { skipSuccessToast: true },
    onSettled: () => {
      useAuthStore.getState().clearAuth()
      queryClient.clear()
    },
  })
}
