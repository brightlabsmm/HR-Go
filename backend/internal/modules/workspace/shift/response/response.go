package response

import "time"

type ShiftResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	BranchID       *string   `json:"branchId,omitempty"`
	BranchName     *string   `json:"branchName,omitempty"`
	ShiftName      string    `json:"shiftName"`
	StartTime      string    `json:"startTime"`
	EndTime        string    `json:"endTime"`
	BreakMinutes   int       `json:"breakMinutes"`
	Status         string    `json:"status"`
	IsDefault      bool      `json:"isDefault"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type ShiftListResponse struct {
	Items      []ShiftResponse `json:"items"`
	Pagination PaginationMeta  `json:"pagination"`
}

type AssignmentResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	EmployeeID     string    `json:"employeeId"`
	EmployeeCode   string    `json:"employeeCode"`
	EmployeeName   string    `json:"employeeName"`
	ShiftID        string    `json:"shiftId"`
	ShiftName      string    `json:"shiftName"`
	StartTime      string    `json:"startTime"`
	EndTime        string    `json:"endTime"`
	EffectiveFrom  string    `json:"effectiveFrom"`
	EffectiveTo    *string   `json:"effectiveTo,omitempty"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type AssignmentListResponse struct {
	Items      []AssignmentResponse `json:"items"`
	Pagination PaginationMeta       `json:"pagination"`
}

type AssignmentHistoryResponse struct {
	ID               string    `json:"id"`
	AssignmentID     *string   `json:"assignmentId,omitempty"`
	EmployeeID       string    `json:"employeeId"`
	OldShiftID       *string   `json:"oldShiftId,omitempty"`
	OldShiftName     *string   `json:"oldShiftName,omitempty"`
	NewShiftID       *string   `json:"newShiftId,omitempty"`
	NewShiftName     *string   `json:"newShiftName,omitempty"`
	OldEffectiveFrom *string   `json:"oldEffectiveFrom,omitempty"`
	OldEffectiveTo   *string   `json:"oldEffectiveTo,omitempty"`
	NewEffectiveFrom *string   `json:"newEffectiveFrom,omitempty"`
	NewEffectiveTo   *string   `json:"newEffectiveTo,omitempty"`
	ChangedAt        time.Time `json:"changedAt"`
	Reason           *string   `json:"reason,omitempty"`
}

type PaginationMeta struct {
	Total       int64 `json:"total"`
	Page        int   `json:"page"`
	PageSize    int   `json:"pageSize"`
	TotalPages  int   `json:"totalPages"`
	HasNextPage bool  `json:"hasNextPage"`
	HasPrevPage bool  `json:"hasPrevPage"`
}
