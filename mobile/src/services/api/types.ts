/**
 * Phase 2 Mobile API Types
 * Matched with backend Go request and response models.
 */

// Error format matching backend Section 3.7
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    traceId?: string;
  };
}

// ------------------- Auth & Profile -------------------

export interface MobileLoginRequest {
  organizationCode?: string;
  identifier: string;
  password: string;
  deviceIdentifier: string;
  deviceName?: string;
}

export interface MobileOrgInfo {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
}

export interface MobileDeviceResponse {
  id: string;
  deviceIdentifier: string;
  deviceName?: string;
  status: string;
}

export interface MobileEmployeePersonalProfile {
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  address?: string;
  emergencyContact?: string;
}

export interface MobilePositionHistoryItem {
  id: string;
  oldPositionTitle?: string;
  newPositionTitle: string;
  effectiveDate: string;
  remarks?: string;
}

export interface MobileUserProfile {
  accountId: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  branchName: string;
  departmentId?: string;
  departmentName: string;
  positionId?: string;
  positionTitle: string;
  dateOfJoining?: string;
  employmentStatus: string;
  organization: MobileOrgInfo;
  roles: string[];
  permissions: string[];
  profile?: MobileEmployeePersonalProfile;
  positionHistory?: MobilePositionHistoryItem[];
}

export interface MobileLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  mustChangePassword?: boolean;
  user: MobileUserProfile;
  device: MobileDeviceResponse;
}

export interface MobileChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ------------------- Shift -------------------

export interface MobileShiftResponse {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriodMinutes: number;
  workDays: string[];
}

// ------------------- Attendance & Punching -------------------

export interface MobileTodayResponse {
  attendanceDate: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'WORKING' | 'NOT_CHECKED_IN' | string;
  checkInTime?: string;
  checkOutTime?: string;
  workMinutes: number;
  shift?: MobileShiftResponse;
  isHoliday: boolean;
  holidayName?: string;
}

export interface MobilePunchRequest {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  deviceId?: string;
  notes?: string;
  offlineEventId?: string;
}

export interface AttendanceRecordResponse {
  id: string;
  organizationId: string;
  employeeId: string;
  shiftId?: string;
  shiftName?: string;
  attendanceDate: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInSource?: string;
  checkOutSource?: string;
  checkInAddress?: string;
  checkOutAddress?: string;
  workMinutes?: number;
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  overtimeMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileAttendanceHistoryQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceListResponse {
  items: AttendanceRecordResponse[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ------------------- Calendar -------------------

export interface MobileCalendarDay {
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  isHoliday: boolean;
  holidayName?: string;
}

export interface MobileCalendarResponse {
  year: number;
  month: number;
  days: MobileCalendarDay[];
}

// ------------------- Corrections -------------------

export interface MobileCorrectionRequest {
  attendanceRecordId: string;
  requestedCheckInTime?: string; // ISO 8601
  requestedCheckOutTime?: string; // ISO 8601
  reason: string;
}

export interface CorrectionResponse {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  attendanceRecordId: string;
  attendanceDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedCheckInTime?: string;
  requestedCheckOutTime?: string;
  originalCheckInTime?: string;
  originalCheckOutTime?: string;
  reason: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMobileCorrectionsQuery {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface MobileCorrectionListResponse {
  items: CorrectionResponse[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ------------------- Offline Sync -------------------

export interface OfflineEventRequest {
  localEventId: string;
  eventType: 'CHECK_IN' | 'CHECK_OUT';
  localEventTime: string; // ISO 8601
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  notes?: string;
}

export interface MobileSyncRequest {
  events: OfflineEventRequest[];
}

export interface SyncResultItem {
  localEventId: string;
  resultStatus: 'ACCEPTED' | 'CONFLICT' | 'REJECTED';
  errorMessage?: string;
}

export interface MobileSyncResponse {
  processedCount: number;
  successCount: number;
  failedCount: number;
  results: SyncResultItem[];
}
