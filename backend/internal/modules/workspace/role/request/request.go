package request

import (
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type ListRolesQuery struct {
	sorting.Query
	filtering.Params
}

type RoleAssignmentInput struct {
	RoleID       string  `json:"roleId" binding:"required"`
	BranchID     *string `json:"branchId"`
	DepartmentID *string `json:"departmentId"`
}

type ReplaceAccountRolesRequest struct {
	Assignments []RoleAssignmentInput `json:"assignments" binding:"required"`
}
