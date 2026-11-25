import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createLeaveType,
  listLeaveRequests,
  listLeaveTypes,
  reviewLeaveRequest,
} from "@/shared/services/leave.service"
import { useAuthStore } from "@/shared/stores/auth.store"

export const leaveKeys = {
  types: ["leave-types"] as const,
  requests: (params?: { page?: number; pageSize?: number; status?: string }) =>
    ["leave-requests", params ?? {}] as const,
}

export function useLeaveTypesQuery() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: listLeaveTypes,
    enabled: Boolean(accessToken),
  })
}

export function useLeaveRequestsQuery(params?: {
  page?: number
  pageSize?: number
  status?: string
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: leaveKeys.requests(params),
    queryFn: () => listLeaveRequests(params),
    enabled: Boolean(accessToken),
  })
}

export function useCreateLeaveTypeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLeaveType,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leaveKeys.types })
    },
  })
}

export function useReviewLeaveRequestMutation() {
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
    }) => reviewLeaveRequest(id, { decision, remarks }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leave-requests"] })
    },
  })
}
