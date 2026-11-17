package request

type ListPermissionsQuery struct {
	Scope    string `form:"scope"` // PLATFORM or ORG
	Grouping string `form:"grouping"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"pageSize,default=50"`
}

type ReplaceRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds"`
}
