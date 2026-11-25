import { apiClient } from './client';
import {
  MobileTodayResponse,
  MobilePunchRequest,
  AttendanceRecordResponse,
  MobileAttendanceHistoryQuery,
  AttendanceListResponse,
  MobileCalendarResponse,
  MobileCorrectionRequest,
  CorrectionResponse,
  ListMobileCorrectionsQuery,
  MobileCorrectionListResponse,
  MobileSyncRequest,
  MobileSyncResponse,
} from './types';

export const attendanceApi = {
  getToday: async (): Promise<MobileTodayResponse> => {
    return apiClient.get<MobileTodayResponse>('/workspace/mobile/attendance/today');
  },

  checkIn: async (req: MobilePunchRequest = {}): Promise<AttendanceRecordResponse> => {
    return apiClient.post<AttendanceRecordResponse>('/workspace/mobile/attendance/check-in', req);
  },

  checkOut: async (req: MobilePunchRequest = {}): Promise<AttendanceRecordResponse> => {
    return apiClient.post<AttendanceRecordResponse>('/workspace/mobile/attendance/check-out', req);
  },

  getHistory: async (
    query?: MobileAttendanceHistoryQuery
  ): Promise<AttendanceListResponse> => {
    const params = new URLSearchParams();
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    const endpoint = `/workspace/mobile/attendance/history${qs ? `?${qs}` : ''}`;
    return apiClient.get<AttendanceListResponse>(endpoint);
  },

  getCalendar: async (
    year: number,
    month: number
  ): Promise<MobileCalendarResponse> => {
    const endpoint = `/workspace/mobile/calendar?year=${year}&month=${month}`;
    return apiClient.get<MobileCalendarResponse>(endpoint);
  },

  submitCorrection: async (
    req: MobileCorrectionRequest
  ): Promise<CorrectionResponse> => {
    return apiClient.post<CorrectionResponse>('/workspace/mobile/attendance/corrections', req);
  },

  listCorrections: async (
    query?: ListMobileCorrectionsQuery
  ): Promise<MobileCorrectionListResponse> => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));

    const qs = params.toString();
    const endpoint = `/workspace/mobile/attendance/corrections${qs ? `?${qs}` : ''}`;
    return apiClient.get<MobileCorrectionListResponse>(endpoint);
  },

  syncOffline: async (req: MobileSyncRequest): Promise<MobileSyncResponse> => {
    return apiClient.post<MobileSyncResponse>('/workspace/mobile/attendance/sync', req);
  },
};
