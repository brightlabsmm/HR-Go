import { apiClient } from './client';

export interface MobileOvertimeCategory {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  rateMultiplier: number;
  minMinutes: number;
  maxDailyMinutes: number;
  requiresPreApproval: boolean;
  status: string;
}

export interface MobileOvertimeRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  overtimeCategoryId: string;
  categoryCode: string;
  categoryName: string;
  multiplier: number;
  workDate: string;
  startTime: string;
  endTime: string;
  requestedMinutes: number;
  reason: string;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  decisionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileOvertimeListResponse {
  items: MobileOvertimeRequest[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SubmitOvertimeRequestInput {
  overtimeCategoryId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export const overtimeApi = {
  async listCategories(): Promise<MobileOvertimeCategory[]> {
    const res = await apiClient.get<{ items: MobileOvertimeCategory[] }>(
      '/workspace/mobile/overtime/categories'
    );
    return res?.items ?? [];
  },

  async listRequests(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<MobileOvertimeListResponse> {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.pageSize) qs.append('pageSize', String(params.pageSize));
    const q = qs.toString();
    return apiClient.get<MobileOvertimeListResponse>(
      `/workspace/mobile/overtime/requests${q ? `?${q}` : ''}`
    );
  },

  async submitRequest(input: SubmitOvertimeRequestInput): Promise<MobileOvertimeRequest> {
    return apiClient.post<MobileOvertimeRequest>('/workspace/mobile/overtime/requests', input);
  },
};
