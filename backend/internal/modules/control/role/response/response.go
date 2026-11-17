package response

type PermissionResponse struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Scope       string `json:"scope"`
	Grouping    string `json:"grouping"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

type RoleResponse struct {
	ID          string               `json:"id"`
	Code        string               `json:"roleCode"`
	Name        string               `json:"roleName"`
	Description string               `json:"description"`
	Permissions []PermissionResponse `json:"permissions"`
}
