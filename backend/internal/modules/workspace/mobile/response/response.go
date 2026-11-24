package response

import (
	attendanceresponse "hrgo/backend/internal/modules/workspace/attendance/response"
)

type MobileOrgInfo struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	LegalName   string `json:"legalName"`
	DisplayName string `json:"displayName"`
}

type MobileDeviceResponse struct {
	ID               string  `json:"id"`
	DeviceIdentifier string  `json:"deviceIdentifier"`
	DeviceName       *string `json:"deviceName"`
	Status           string  `json:"status"`
}

type MobileUserProfile struct {
	AccountID        string        `json:"accountId"`
	EmployeeID       string        `json:"employeeId"`
	EmployeeCode     string        `json:"employeeCode"`
	FirstName        string        `json:"firstName"`
	LastName         string        `json:"lastName"`
	Email            *string       `json:"email"`
	Phone            *string       `json:"phone"`
	BranchID         *string       `json:"branchId"`
	BranchName       string        `json:"branchName"`
	DepartmentID     *string       `json:"departmentId"`
	DepartmentName   string        `json:"departmentName"`
	PositionID       *string       `json:"positionId"`
	PositionTitle    string        `json:"positionTitle"`
	DateOfJoining    *string       `json:"dateOfJoining"`
	EmploymentStatus string        `json:"employmentStatus"`
	Organization     MobileOrgInfo `json:"organization"`
	Roles            []string      `json:"roles"`
	Permissions      []string      `json:"permissions"`
}

type MobileLoginResponse struct {
	AccessToken        string               `json:"accessToken"`
	TokenType          string               `json:"tokenType"`
	ExpiresIn          int64                `json:"expiresIn"`
	MustChangePassword bool                 `json:"mustChangePassword"`
	User               MobileUserProfile    `json:"user"`
	Device             MobileDeviceResponse `json:"device"`
}

type MobileShiftResponse struct {
	ID                 string   `json:"id"`
	ShiftName          string   `json:"shiftName"`
	StartTime          string   `json:"startTime"`
	EndTime            string   `json:"endTime"`
	GracePeriodMinutes int      `json:"gracePeriodMinutes"`
	WorkDays           []string `json:"workDays"`
}

type MobileTodayResponse struct {
	AttendanceDate string               `json:"attendanceDate"`
	Status         string               `json:"status"`
	CheckInTime    *string              `json:"checkInTime"`
	CheckOutTime   *string              `json:"checkOutTime"`
	WorkMinutes    int                  `json:"workMinutes"`
	Shift          *MobileShiftResponse `json:"shift,omitempty"`
	IsHoliday      bool                 `json:"isHoliday"`
	HolidayName    *string              `json:"holidayName,omitempty"`
}

type MobileCalendarDay struct {
	Date         string  `json:"date"`
	Status       string  `json:"status"`
	CheckInTime  *string `json:"checkInTime"`
	CheckOutTime *string `json:"checkOutTime"`
	IsHoliday    bool    `json:"isHoliday"`
	HolidayName  *string `json:"holidayName,omitempty"`
}

type MobileCalendarResponse struct {
	Year  int                 `json:"year"`
	Month int                 `json:"month"`
	Days  []MobileCalendarDay `json:"days"`
}

type SyncResultItem struct {
	LocalEventID string  `json:"localEventId"`
	ResultStatus string  `json:"resultStatus"`
	ErrorMessage *string `json:"errorMessage,omitempty"`
}

type MobileSyncResponse struct {
	ProcessedCount int              `json:"processedCount"`
	SuccessCount   int              `json:"successCount"`
	FailedCount    int              `json:"failedCount"`
	Results        []SyncResultItem `json:"results"`
}

type MobileCorrectionListResponse struct {
	Items      []attendanceresponse.CorrectionResponse `json:"items"`
	TotalItems int64                                   `json:"totalItems"`
	Page       int                                     `json:"page"`
	PageSize   int                                     `json:"pageSize"`
	TotalPages int                                     `json:"totalPages"`
}
