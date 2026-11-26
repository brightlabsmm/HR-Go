package response

import "time"

type DepartmentResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	BranchID       *string   `json:"branchId"`
	DepartmentCode string    `json:"departmentCode"`
	DepartmentName string    `json:"departmentName"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
