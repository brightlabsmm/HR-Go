package request

type RoleAssignmentInput struct {
	RoleID       string  `json:"roleId" binding:"required"`
	BranchID     *string `json:"branchId"`
	DepartmentID *string `json:"departmentId"`
}

type ReplaceAccountRolesRequest struct {
	Assignments []RoleAssignmentInput `json:"assignments" binding:"required"`
}
