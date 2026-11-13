package response

type PermissionResponse struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

type OrgRoleResponse struct {
	ID          string               `json:"id"`
	RoleCode    string               `json:"roleCode"`
	RoleName    string               `json:"roleName"`
	Description string               `json:"description"`
	IsSystem    bool                 `json:"isSystem"`
	Permissions []PermissionResponse `json:"permissions"`
}
