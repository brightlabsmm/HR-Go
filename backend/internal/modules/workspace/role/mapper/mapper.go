package mapper

import (
	"hrgo/backend/internal/modules/workspace/role/models"
	"hrgo/backend/internal/modules/workspace/role/response"
)

func ToOrgRoleResponse(r *models.OrgRole) response.OrgRoleResponse {
	perms := make([]response.PermissionResponse, 0, len(r.Permissions))
	for i := range r.Permissions {
		perms = append(perms, response.PermissionResponse{
			ID:          r.Permissions[i].ID,
			Code:        r.Permissions[i].Code,
			Resource:    r.Permissions[i].Resource,
			Action:      r.Permissions[i].Action,
			Description: r.Permissions[i].Description,
		})
	}
	return response.OrgRoleResponse{
		ID:          r.ID,
		RoleCode:    r.Code,
		RoleName:    r.Name,
		Description: r.Description,
		IsSystem:    r.IsSystem,
		Permissions: perms,
	}
}

func ToOrgRoleList(roles []models.OrgRole) []response.OrgRoleResponse {
	res := make([]response.OrgRoleResponse, 0, len(roles))
	for i := range roles {
		res = append(res, ToOrgRoleResponse(&roles[i]))
	}
	return res
}
