package request

type UpdateOrganizationSettingsRequest struct {
	DisplayName          *string `json:"displayName" binding:"omitempty,max=255"`
	ContactEmail         *string `json:"contactEmail" binding:"omitempty,email,max=255"`
	ContactPhone         *string `json:"contactPhone" binding:"omitempty,max=50"`
	Country              *string `json:"country" binding:"omitempty,max=10"`
	Address              *string `json:"address" binding:"omitempty,max=2000"`
	BranchCodeFormat     *string `json:"branchCodeFormat" binding:"omitempty,max=50"`
	DepartmentCodeFormat *string `json:"departmentCodeFormat" binding:"omitempty,max=50"`
}
