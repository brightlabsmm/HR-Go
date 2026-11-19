package request

import (
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type ListRolesQuery struct {
	sorting.Query
	filtering.Params
}

type ListPermissionsQuery struct {
	Scope    string `form:"scope"` // PLATFORM or ORG
	Grouping string `form:"grouping"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=50"`
	sorting.Query
	filtering.Params
}

type ReplaceRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds"`
}
