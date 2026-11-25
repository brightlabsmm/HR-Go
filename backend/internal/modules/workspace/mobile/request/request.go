package request

import "time"

type MobileLoginRequest struct {
	OrganizationCode string `json:"organizationCode" binding:"omitempty,max=50"`
	Identifier       string `json:"identifier" binding:"required,max=255"`
	Password         string `json:"password" binding:"required,max=255"`
	DeviceIdentifier string `json:"deviceIdentifier" binding:"required,max=255"`
	DeviceName       string `json:"deviceName" binding:"omitempty,max=255"`
}

type MobileChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required,max=255"`
	NewPassword string `json:"newPassword" binding:"required,min=8,max=255"`
}

type MobilePunchRequest struct {
	Latitude       *float64 `json:"latitude" binding:"omitempty,gte=-90,lte=90"`
	Longitude      *float64 `json:"longitude" binding:"omitempty,gte=-180,lte=180"`
	Accuracy       *float64 `json:"accuracy" binding:"omitempty,gte=0"`
	Address        *string  `json:"address" binding:"omitempty,max=500"`
	DeviceID       *string  `json:"deviceId" binding:"omitempty,max=255"`
	Notes          *string  `json:"notes" binding:"omitempty,max=500"`
	OfflineEventID *string  `json:"offlineEventId" binding:"omitempty,max=100"`
}

type MobileCorrectionRequest struct {
	AttendanceRecordID    string     `json:"attendanceRecordId" binding:"required,uuid"`
	RequestedCheckInTime  *time.Time `json:"requestedCheckInTime"`
	RequestedCheckOutTime *time.Time `json:"requestedCheckOutTime"`
	Reason                string     `json:"reason" binding:"required,max=1000"`
}

type OfflineEventRequest struct {
	LocalEventID   string    `json:"localEventId" binding:"required,max=100"`
	EventType      string    `json:"eventType" binding:"required,oneof=CHECK_IN CHECK_OUT"`
	LocalEventTime time.Time `json:"localEventTime" binding:"required"`
	Latitude       *float64  `json:"latitude" binding:"omitempty,gte=-90,lte=90"`
	Longitude      *float64  `json:"longitude" binding:"omitempty,gte=-180,lte=180"`
	Accuracy       *float64  `json:"accuracy" binding:"omitempty,gte=0"`
	Address        *string   `json:"address" binding:"omitempty,max=500"`
	Notes          *string   `json:"notes" binding:"omitempty,max=500"`
}

type MobileSyncRequest struct {
	Events []OfflineEventRequest `json:"events" binding:"required,min=1,dive"`
}

type MobileAttendanceHistoryQuery struct {
	StartDate *string `form:"startDate"`
	EndDate   *string `form:"endDate"`
	Page      int     `form:"page"`
	PageSize  int     `form:"pageSize"`
}

type MobileCalendarQuery struct {
	Year  int `form:"year"`
	Month int `form:"month"`
}

type ListMobileCorrectionsQuery struct {
	Status   *string `form:"status"`
	Page     int     `form:"page"`
	PageSize int     `form:"pageSize"`
}
