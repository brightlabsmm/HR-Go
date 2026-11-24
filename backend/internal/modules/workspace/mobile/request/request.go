package request

import "time"

type MobileLoginRequest struct {
	OrganizationCode string `json:"organizationCode"`
	Identifier       string `json:"identifier" validate:"required"`
	Password         string `json:"password" validate:"required"`
	DeviceIdentifier string `json:"deviceIdentifier" validate:"required"`
	DeviceName       string `json:"deviceName"`
}

type MobileChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" validate:"required"`
	NewPassword string `json:"newPassword" validate:"required,min=8"`
}

type MobilePunchRequest struct {
	Latitude       *float64 `json:"latitude"`
	Longitude      *float64 `json:"longitude"`
	Accuracy       *float64 `json:"accuracy"`
	Address        *string  `json:"address"`
	DeviceID       *string  `json:"deviceId"`
	Notes          *string  `json:"notes"`
	OfflineEventID *string  `json:"offlineEventId"`
}

type MobileCorrectionRequest struct {
	AttendanceRecordID    string     `json:"attendanceRecordId" validate:"required,uuid"`
	RequestedCheckInTime  *time.Time `json:"requestedCheckInTime"`
	RequestedCheckOutTime *time.Time `json:"requestedCheckOutTime"`
	Reason                string     `json:"reason" validate:"required"`
}

type OfflineEventRequest struct {
	LocalEventID   string    `json:"localEventId" validate:"required"`
	EventType      string    `json:"eventType" validate:"required,oneof=CHECK_IN CHECK_OUT"`
	LocalEventTime time.Time `json:"localEventTime" validate:"required"`
	Latitude       *float64  `json:"latitude"`
	Longitude      *float64  `json:"longitude"`
	Accuracy       *float64  `json:"accuracy"`
	Address        *string   `json:"address"`
	Notes          *string   `json:"notes"`
}

type MobileSyncRequest struct {
	Events []OfflineEventRequest `json:"events" validate:"required,dive"`
}

type MobileAttendanceHistoryQuery struct {
	StartDate *string `query:"startDate"`
	EndDate   *string `query:"endDate"`
	Page      int     `query:"page"`
	PageSize  int     `query:"pageSize"`
}

type MobileCalendarQuery struct {
	Year  int `query:"year"`
	Month int `query:"month"`
}

type ListMobileCorrectionsQuery struct {
	Status   *string `query:"status"`
	Page     int     `query:"page"`
	PageSize int     `query:"pageSize"`
}
