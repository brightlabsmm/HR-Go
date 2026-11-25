import { apiClient } from './client';

export interface MobileLeaveBalance {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  requiresBalance: boolean;
  balanceYear: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface MobileLeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  requestedDays: number;
  reason: string;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  decisionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileLeaveRequestListResponse {
  items: MobileLeaveRequest[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubmitLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  reason: string;
}

export const leaveApi = {
  async listBalances(): Promise<MobileLeaveBalance[]> {
    const res = await apiClient.get<{ items: MobileLeaveBalance[] }>(
      '/workspace/mobile/leave/balances'
    );
    return res?.items ?? [];
  },

  async listRequests(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<MobileLeaveRequestListResponse> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.pageSize) qs.append('pageSize', String(params.pageSize));
    const q = qs.toString();
    return apiClient.get<MobileLeaveRequestListResponse>(
      `/workspace/mobile/leave/requests${q ? `?${q}` : ''}`
    );
  },

  async submitRequest(input: SubmitLeaveRequestInput): Promise<MobileLeaveRequest> {
    return apiClient.post<MobileLeaveRequest>('/workspace/mobile/leave/requests', input);
  },

  async cancelRequest(id: string): Promise<MobileLeaveRequest> {
    return apiClient.post<MobileLeaveRequest>(`/workspace/mobile/leave/requests/${id}/cancel`);
  },
};
