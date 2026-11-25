package request

type CreateLeaveTypeRequest struct {
	Code               string  `json:"code" binding:"required,max=30"`
	Name               string  `json:"name" binding:"required,max=100"`
	Description        *string `json:"description"`
	IsPaid             *bool   `json:"isPaid"`
	RequiresBalance    *bool   `json:"requiresBalance"`
	AnnualAllowance    float64 `json:"annualAllowance" binding:"gte=0"`
	MinNoticeDays      int     `json:"minNoticeDays" binding:"gte=0"`
	MaxConsecutiveDays *int    `json:"maxConsecutiveDays"`
	AllowHalfDay       *bool   `json:"allowHalfDay"`
	CarryOverLimit     float64 `json:"carryOverLimit" binding:"gte=0"`
}

type UpdateLeaveTypeRequest struct {
	Name            *string  `json:"name"`
	Description     *string  `json:"description"`
	IsPaid          *bool    `json:"isPaid"`
	RequiresBalance *bool    `json:"requiresBalance"`
	AnnualAllowance *float64 `json:"annualAllowance"`
	Status          *string  `json:"status"`
}

type AdjustLeaveBalanceRequest struct {
	EmployeeID     string  `json:"employeeId" binding:"required"`
	LeaveTypeID    string  `json:"leaveTypeId" binding:"required"`
	BalanceYear    int     `json:"balanceYear" binding:"required,min=2000,max=2100"`
	AdjustmentDays float64 `json:"adjustmentDays" binding:"required"`
	Reason         string  `json:"reason" binding:"required"`
}

type CreateLeaveRequest struct {
	EmployeeID  string `json:"employeeId"`
	LeaveTypeID string `json:"leaveTypeId" binding:"required"`
	StartDate   string `json:"startDate" binding:"required"`
	EndDate     string `json:"endDate" binding:"required"`
	IsHalfDay   bool   `json:"isHalfDay"`
	Reason      string `json:"reason" binding:"required"`
}

type ReviewLeaveRequest struct {
	Decision string  `json:"decision" binding:"required"`
	Remarks  *string `json:"remarks"`
}

type ListLeaveRequestsQuery struct {
	Page       int    `form:"page,default=1" binding:"omitempty,min=1"`
	PageSize   int    `form:"pageSize,default=20" binding:"omitempty,min=1,max=100"`
	Status     string `form:"status"`
	EmployeeID string `form:"employeeId"`
}

type ListLeaveBalancesQuery struct {
	EmployeeID string `form:"employeeId"`
	Year       int    `form:"year"`
}
