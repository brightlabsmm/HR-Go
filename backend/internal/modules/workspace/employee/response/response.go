package response

import "time"

type EmployeeProfileResponse struct {
	DateOfBirth      *string `json:"dateOfBirth,omitempty"`
	Gender           *string `json:"gender,omitempty"`
	Nationality      *string `json:"nationality,omitempty"`
	MaritalStatus    *string `json:"maritalStatus,omitempty"`
	Address          *string `json:"address,omitempty"`
	EmergencyContact *string `json:"emergencyContact,omitempty"`
}

type EmployeeResponse struct {
	ID               string                   `json:"id"`
	OrganizationID   string                   `json:"organizationId"`
	EmployeeCode     string                   `json:"employeeCode"`
	FirstName        string                   `json:"firstName"`
	LastName         string                   `json:"lastName"`
	FullName         string                   `json:"fullName"`
	Email            *string                  `json:"email,omitempty"`
	Phone            *string                  `json:"phone,omitempty"`
	BranchID         *string                  `json:"branchId,omitempty"`
	BranchName       *string                  `json:"branchName,omitempty"`
	DepartmentID     *string                  `json:"departmentId,omitempty"`
	DepartmentName   *string                  `json:"departmentName,omitempty"`
	PositionID       *string                  `json:"positionId,omitempty"`
	PositionTitle    *string                  `json:"positionTitle,omitempty"`
	DateOfJoining    *string                  `json:"dateOfJoining,omitempty"`
	EmploymentStatus string                   `json:"employmentStatus"`
	Profile          *EmployeeProfileResponse `json:"profile,omitempty"`
	CreatedAt        time.Time                `json:"createdAt"`
	UpdatedAt        time.Time                `json:"updatedAt"`
}

type PositionHistoryResponse struct {
	ID               string    `json:"id"`
	EmployeeID       string    `json:"employeeId"`
	OldPositionID    *string   `json:"oldPositionId,omitempty"`
	OldPositionTitle *string   `json:"oldPositionTitle,omitempty"`
	NewPositionID    string    `json:"newPositionId"`
	NewPositionTitle string    `json:"newPositionTitle"`
	EffectiveDate    string    `json:"effectiveDate"`
	Remarks          *string   `json:"remarks,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
}

type PaginationMeta struct {
	Total       int64 `json:"total"`
	Page        int   `json:"page"`
	PageSize    int   `json:"pageSize"`
	TotalPages  int   `json:"totalPages"`
	HasNextPage bool  `json:"hasNextPage"`
	HasPrevPage bool  `json:"hasPrevPage"`
}

type EmployeeListResponse struct {
	Items      []EmployeeResponse `json:"items"`
	Pagination PaginationMeta     `json:"pagination"`
}
