package request

type CheckInRequest struct {
	EmployeeID  string  `json:"employeeId" binding:"required,uuid"`
	CheckInTime *string `json:"checkInTime"` // RFC3339 or empty for current time
	ShiftID     *string `json:"shiftId" binding:"omitempty,uuid"`
	Source      *string `json:"source" binding:"omitempty,max=30"`
	Remarks     *string `json:"remarks" binding:"omitempty,max=500"`
}

type CheckOutRequest struct {
	EmployeeID   string  `json:"employeeId" binding:"required,uuid"`
	CheckOutTime *string `json:"checkOutTime"` // RFC3339 or empty for current time
	Remarks      *string `json:"remarks" binding:"omitempty,max=500"`
}

type ManualAttendanceRequest struct {
	EmployeeID       string  `json:"employeeId" binding:"required,uuid"`
	AttendanceDate   string  `json:"attendanceDate" binding:"required"` // YYYY-MM-DD
	ShiftID          *string `json:"shiftId" binding:"omitempty,uuid"`
	CheckIn          *string `json:"checkIn"`  // RFC3339
	CheckOut         *string `json:"checkOut"` // RFC3339
	AttendanceStatus *string `json:"attendanceStatus" binding:"omitempty,oneof=PRESENT ABSENT LATE HALF_DAY ON_LEAVE HOLIDAY"`
	Remarks          *string `json:"remarks" binding:"omitempty,max=500"`
}

type CreateCorrectionRequest struct {
	EmployeeID        string  `json:"employeeId" binding:"required,uuid"`
	AttendanceID      *string `json:"attendanceId" binding:"omitempty,uuid"`
	AttendanceDate    string  `json:"attendanceDate" binding:"required"` // YYYY-MM-DD
	RequestedCheckIn  *string `json:"requestedCheckIn"`                  // RFC3339
	RequestedCheckOut *string `json:"requestedCheckOut"`                 // RFC3339
	Reason            string  `json:"reason" binding:"required,max=1000"`
}

type ReviewCorrectionRequest struct {
	Decision string  `json:"decision" binding:"required,oneof=APPROVED REJECTED"`
	Reason   *string `json:"reason" binding:"omitempty,max=1000"`
}

type ListAttendanceQuery struct {
	EmployeeID   string `form:"employeeId"`
	BranchID     string `form:"branchId"`
	DepartmentID string `form:"departmentId"`
	Status       string `form:"status"`
	Date         string `form:"date"` // YYYY-MM-DD
	From         string `form:"from"` // YYYY-MM-DD
	To           string `form:"to"`   // YYYY-MM-DD
	Page         int    `form:"page,default=1"`
	PageSize     int    `form:"pageSize,default=20"`
}

type AttendanceSummaryQuery struct {
	EmployeeID   string `form:"employeeId"`
	BranchID     string `form:"branchId"`
	DepartmentID string `form:"departmentId"`
	From         string `form:"from" binding:"required"` // YYYY-MM-DD
	To           string `form:"to" binding:"required"`   // YYYY-MM-DD
}

type ListCorrectionsQuery struct {
	EmployeeID string `form:"employeeId"`
	Status     string `form:"status"`
	From       string `form:"from"`
	To         string `form:"to"`
	Page       int    `form:"page,default=1"`
	PageSize   int    `form:"pageSize,default=20"`
}
