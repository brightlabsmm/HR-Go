package response

import "time"

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

type MobileEmployeePersonalProfile struct {
	DateOfBirth      *string `json:"dateOfBirth,omitempty"`
	Gender           *string `json:"gender,omitempty"`
	Nationality      *string `json:"nationality,omitempty"`
	MaritalStatus    *string `json:"maritalStatus,omitempty"`
	Address          *string `json:"address,omitempty"`
	EmergencyContact *string `json:"emergencyContact,omitempty"`
}

type MobilePositionHistoryItem struct {
	ID               string  `json:"id"`
	OldPositionTitle *string `json:"oldPositionTitle,omitempty"`
	NewPositionTitle string  `json:"newPositionTitle"`
	EffectiveDate    string  `json:"effectiveDate"`
	Remarks          *string `json:"remarks,omitempty"`
}

type MobileUserProfile struct {
	AccountID        string                         `json:"accountId"`
	EmployeeID       string                         `json:"employeeId"`
	EmployeeCode     string                         `json:"employeeCode"`
	FirstName        string                         `json:"firstName"`
	LastName         string                         `json:"lastName"`
	Email            *string                        `json:"email"`
	Phone            *string                        `json:"phone"`
	BranchID         *string                        `json:"branchId"`
	BranchName       string                         `json:"branchName"`
	DepartmentID     *string                        `json:"departmentId"`
	DepartmentName   string                         `json:"departmentName"`
	PositionID       *string                        `json:"positionId"`
	PositionTitle    string                         `json:"positionTitle"`
	DateOfJoining    *string                        `json:"dateOfJoining"`
	EmploymentStatus string                         `json:"employmentStatus"`
	Organization     MobileOrgInfo                  `json:"organization"`
	Roles            []string                       `json:"roles"`
	Permissions      []string                       `json:"permissions"`
	Profile          *MobileEmployeePersonalProfile `json:"profile,omitempty"`
	PositionHistory  []MobilePositionHistoryItem    `json:"positionHistory,omitempty"`
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
	BreakMinutes       int      `json:"breakMinutes"`
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

type MobileAttendanceRecordResponse struct {
	ID                    string    `json:"id"`
	OrganizationID        string    `json:"organizationId"`
	EmployeeID            string    `json:"employeeId"`
	ShiftID               *string   `json:"shiftId,omitempty"`
	ShiftName             *string   `json:"shiftName,omitempty"`
	AttendanceDate        string    `json:"attendanceDate"`
	Status                string    `json:"status"`
	CheckInTime           *string   `json:"checkInTime,omitempty"`
	CheckOutTime          *string   `json:"checkOutTime,omitempty"`
	CheckInSource         *string   `json:"checkInSource,omitempty"`
	CheckOutSource        *string   `json:"checkOutSource,omitempty"`
	WorkMinutes           int       `json:"workMinutes"`
	LateMinutes           int       `json:"lateMinutes"`
	EarlyDepartureMinutes int       `json:"earlyDepartureMinutes"`
	OvertimeMinutes       int       `json:"overtimeMinutes"`
	Notes                 *string   `json:"notes,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type MobileAttendanceListResponse struct {
	Items      []MobileAttendanceRecordResponse `json:"items"`
	TotalItems int64                            `json:"totalItems"`
	Page       int                              `json:"page"`
	PageSize   int                              `json:"pageSize"`
	TotalPages int                              `json:"totalPages"`
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

type MobileCorrectionResponse struct {
	ID                    string    `json:"id"`
	OrganizationID        string    `json:"organizationId"`
	EmployeeID            string    `json:"employeeId"`
	EmployeeCode          string    `json:"employeeCode,omitempty"`
	EmployeeName          string    `json:"employeeName,omitempty"`
	AttendanceRecordID    string    `json:"attendanceRecordId"`
	AttendanceDate        string    `json:"attendanceDate"`
	Status                string    `json:"status"`
	RequestedCheckInTime  *string   `json:"requestedCheckInTime,omitempty"`
	RequestedCheckOutTime *string   `json:"requestedCheckOutTime,omitempty"`
	OriginalCheckInTime   *string   `json:"originalCheckInTime,omitempty"`
	OriginalCheckOutTime  *string   `json:"originalCheckOutTime,omitempty"`
	Reason                string    `json:"reason"`
	ReviewerID            *string   `json:"reviewerId,omitempty"`
	ReviewerName          *string   `json:"reviewerName,omitempty"`
	ReviewedAt            *string   `json:"reviewedAt,omitempty"`
	ReviewerNotes         *string   `json:"reviewerNotes,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type MobileCorrectionListResponse struct {
	Items      []MobileCorrectionResponse `json:"items"`
	TotalItems int64                      `json:"totalItems"`
	Page       int                        `json:"page"`
	PageSize   int                        `json:"pageSize"`
	TotalPages int                        `json:"totalPages"`
}
