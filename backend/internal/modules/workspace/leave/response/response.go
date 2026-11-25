package response

import "time"

type LeaveTypeResponse struct {
	ID              string    `json:"id"`
	OrganizationID  string    `json:"organizationId"`
	Code            string    `json:"code"`
	Name            string    `json:"name"`
	Description     *string   `json:"description,omitempty"`
	IsPaid          bool      `json:"isPaid"`
	RequiresBalance bool      `json:"requiresBalance"`
	AnnualAllowance float64   `json:"annualAllowance"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
}

type LeaveBalanceResponse struct {
	ID              string  `json:"id"`
	OrganizationID  string  `json:"organizationId"`
	EmployeeID      string  `json:"employeeId"`
	EmployeeCode    string  `json:"employeeCode,omitempty"`
	EmployeeName    string  `json:"employeeName,omitempty"`
	LeaveTypeID     string  `json:"leaveTypeId"`
	LeaveTypeCode   string  `json:"leaveTypeCode"`
	LeaveTypeName   string  `json:"leaveTypeName"`
	RequiresBalance bool    `json:"requiresBalance"`
	BalanceYear     int     `json:"balanceYear"`
	AllocatedDays   float64 `json:"allocatedDays"`
	UsedDays        float64 `json:"usedDays"`
	PendingDays     float64 `json:"pendingDays"`
	RemainingDays   float64 `json:"remainingDays"`
}

type LeaveRequestResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	EmployeeID     string    `json:"employeeId"`
	EmployeeCode   string    `json:"employeeCode,omitempty"`
	EmployeeName   string    `json:"employeeName,omitempty"`
	LeaveTypeID    string    `json:"leaveTypeId"`
	LeaveTypeCode  string    `json:"leaveTypeCode"`
	LeaveTypeName  string    `json:"leaveTypeName"`
	StartDate      string    `json:"startDate"`
	EndDate        string    `json:"endDate"`
	IsHalfDay      bool      `json:"isHalfDay"`
	RequestedDays  float64   `json:"requestedDays"`
	Reason         string    `json:"reason"`
	RequestStatus  string    `json:"requestStatus"`
	DecisionNotes  *string   `json:"decisionNotes,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
