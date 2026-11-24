package request

type CreateShiftRequest struct {
	ShiftName    string  `json:"shiftName" binding:"required,max=100"`
	StartTime    string  `json:"startTime" binding:"required"` // HH:MM
	EndTime      string  `json:"endTime" binding:"required"`   // HH:MM
	BreakMinutes *int    `json:"breakMinutes"`
	BranchID     *string `json:"branchId" binding:"omitempty,uuid"`
	IsDefault    *bool   `json:"isDefault"`
}

type UpdateShiftRequest struct {
	ShiftName    *string `json:"shiftName" binding:"omitempty,max=100"`
	StartTime    *string `json:"startTime"`
	EndTime      *string `json:"endTime"`
	BreakMinutes *int    `json:"breakMinutes"`
	BranchID     *string `json:"branchId" binding:"omitempty,uuid"`
	Status       *string `json:"status" binding:"omitempty,oneof=ACTIVE INACTIVE"`
	IsDefault    *bool   `json:"isDefault"`
}

type AssignShiftRequest struct {
	EmployeeID    string  `json:"employeeId" binding:"required,uuid"`
	ShiftID       string  `json:"shiftId" binding:"required,uuid"`
	EffectiveFrom string  `json:"effectiveFrom" binding:"required"` // YYYY-MM-DD
	EffectiveTo   *string `json:"effectiveTo"`                      // YYYY-MM-DD
	Reason        *string `json:"reason" binding:"omitempty,max=255"`
}

type ListShiftsQuery struct {
	BranchID string `form:"branchId"`
	Status   string `form:"status"`
	Q        string `form:"q"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=20"`
}

type ListAssignmentsQuery struct {
	EmployeeID string `form:"employeeId"`
	ShiftID    string `form:"shiftId"`
	Status     string `form:"status"`
	Page       int    `form:"page,default=1"`
	PageSize   int    `form:"pageSize,default=20"`
}
