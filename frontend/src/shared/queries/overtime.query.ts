import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createOvertimeCategory,
  listOvertimeCategories,
  listOvertimeRequests,
  reviewOvertimeRequest,
} from "@/shared/services/overtime.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const overtimeKeys = {
  categories: ["overtime-categories"] as const,
  requests: (params?: { page?: number; pageSize?: number; status?: string }) =>
    ["overtime-requests", params ?? {}] as const,
}

export function useOvertimeCategoriesQuery() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: overtimeKeys.categories,
    queryFn: listOvertimeCategories,
    enabled: Boolean(accessToken),
  })
}

export function useOvertimeRequestsQuery(params?: {
  page?: number
  pageSize?: number
  status?: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: overtimeKeys.requests(params),
    queryFn: () => listOvertimeRequests(params),
    enabled: Boolean(accessToken),
  })
}

export function useCreateOvertimeCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createOvertimeCategory,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.categories })
    },
  })
}

export function useReviewOvertimeRequestMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      decision,
      remarks,
    }: {
      id: string
      decision: "APPROVED" | "REJECTED"
      remarks?: string | null
    }) => reviewOvertimeRequest(id, { decision, remarks }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["overtime-requests"] })
    },
  })
}
