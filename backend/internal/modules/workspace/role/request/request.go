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

type ListPermissionsQuery struct {
	Scope    string `form:"scope"`
	Grouping string `form:"grouping"`
	Search   string `form:"search"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=50"`
}

type ReplaceRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds" binding:"required"`
}
