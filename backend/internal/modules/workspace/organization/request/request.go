package request

type UpdateOrganizationSettingsRequest struct {
	DisplayName          *string `json:"displayName"`
	ContactEmail         *string `json:"contactEmail" binding:"omitempty,email"`
	ContactPhone         *string `json:"contactPhone"`
	Country              *string `json:"country"`
	Address              *string `json:"address"`
	BranchCodeFormat     *string `json:"branchCodeFormat"`
	DepartmentCodeFormat *string `json:"departmentCodeFormat"`
}
