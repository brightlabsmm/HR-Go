package response

type DepartmentResponse struct {
	ID             string  `json:"id"`
	OrganizationID string  `json:"organizationId"`
	BranchID       *string `json:"branchId"`
	DepartmentCode string  `json:"departmentCode"`
	DepartmentName string  `json:"departmentName"`
	Status         string  `json:"status"`
}
