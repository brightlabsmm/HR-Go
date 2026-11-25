package response

import "time"

type AttendanceResponse struct {
	ID                string    `json:"id"`
	OrganizationID    string    `json:"organizationId"`
	EmployeeID        string    `json:"employeeId"`
	EmployeeCode      string    `json:"employeeCode"`
	EmployeeName      string    `json:"employeeName"`
	ShiftID           *string   `json:"shiftId,omitempty"`
	ShiftName         *string   `json:"shiftName,omitempty"`
	BranchName        *string   `json:"branchName,omitempty"`
	DepartmentName    *string   `json:"departmentName,omitempty"`
	AttendanceDate    string    `json:"attendanceDate"`
	CheckIn           *string   `json:"checkIn,omitempty"`
	CheckOut          *string   `json:"checkOut,omitempty"`
	AttendanceStatus  string    `json:"attendanceStatus"`
	LateMinutes       int       `json:"lateMinutes"`
	EarlyLeaveMinutes int       `json:"earlyLeaveMinutes"`
	WorkedMinutes     int       `json:"workedMinutes"`
	Source            string    `json:"source"`
	Remarks           *string   `json:"remarks,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type AttendanceListResponse struct {
	Items      []AttendanceResponse `json:"items"`
	Pagination PaginationMeta       `json:"pagination"`
}

type AttendanceSummaryResponse struct {
	From               string `json:"from"`
	To                 string `json:"to"`
	TotalDays          int    `json:"totalDays"`
	PresentDays        int    `json:"presentDays"`
	LateDays           int    `json:"lateDays"`
	AbsentDays         int    `json:"absentDays"`
	HalfDays           int    `json:"halfDays"`
	TotalWorkedMinutes int    `json:"totalWorkedMinutes"`
	TotalLateMinutes   int    `json:"totalLateMinutes"`
}

type CorrectionResponse struct {
	ID                  string    `json:"id"`
	OrganizationID      string    `json:"organizationId"`
	AttendanceID        *string   `json:"attendanceId,omitempty"`
	EmployeeID          string    `json:"employeeId"`
	EmployeeCode        string    `json:"employeeCode"`
	EmployeeName        string    `json:"employeeName"`
	AttendanceDate      string    `json:"attendanceDate"`
	RequestedCheckIn    *string   `json:"requestedCheckIn,omitempty"`
	RequestedCheckOut   *string   `json:"requestedCheckOut,omitempty"`
	Reason              string    `json:"reason"`
	RequestStatus       string    `json:"requestStatus"`
	ReviewedByAccountID *string   `json:"reviewedByAccountId,omitempty"`
	ReviewerName        *string   `json:"reviewerName,omitempty"`
	ReviewedAt          *string   `json:"reviewedAt,omitempty"`
	RejectionReason     *string   `json:"rejectionReason,omitempty"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

type CorrectionListResponse struct {
	Items      []CorrectionResponse `json:"items"`
	Pagination PaginationMeta       `json:"pagination"`
}

type PaginationMeta struct {
	Total       int64 `json:"total"`
	Page        int   `json:"page"`
	PageSize    int   `json:"pageSize"`
	TotalPages  int   `json:"totalPages"`
	HasNextPage bool  `json:"hasNextPage"`
	HasPrevPage bool  `json:"hasPrevPage"`
}
