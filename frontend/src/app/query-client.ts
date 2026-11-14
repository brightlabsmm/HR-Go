import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { notifyApiError, notifyApiSuccess } from "@/app/api/feedback"
import { ApiError } from "@/app/api/types"
import { APP_CONFIG } from "@/app/config/app.config"

function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }

  return failureCount < 1
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.skipErrorToast) {
        return
      }

      notifyApiError(error, { source: "query" })
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _onMutateResult, mutation) => {
      if (mutation.meta?.skipSuccessToast) {
        return
      }

      notifyApiSuccess(data)
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (mutation.meta?.skipErrorToast) {
        return
      }

      notifyApiError(error, { source: "mutation" })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.defaultQueryStaleTimeMs,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
})
