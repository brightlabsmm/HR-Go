package mapper

import (
	"hrgo/backend/internal/modules/control/role/models"
	"hrgo/backend/internal/modules/control/role/response"
)

func ToPermissionResponse(p *models.Permission) response.PermissionResponse {
	return response.PermissionResponse{
		ID:          p.ID,
		Code:        p.Code,
		Scope:       p.Scope,
		Resource:    p.Resource,
		Action:      p.Action,
		Description: p.Description,
	}
}

func ToPermissionList(perms []models.Permission) []response.PermissionResponse {
	res := make([]response.PermissionResponse, 0, len(perms))
	for i := range perms {
		res = append(res, ToPermissionResponse(&perms[i]))
	}
	return res
}

func ToRoleResponse(r *models.PlatformRole) response.RoleResponse {
	perms := make([]response.PermissionResponse, 0, len(r.Permissions))
	for i := range r.Permissions {
		perms = append(perms, ToPermissionResponse(&r.Permissions[i]))
	}
	return response.RoleResponse{
		ID:          r.ID,
		Code:        r.Code,
		Name:        r.Name,
		Description: r.Description,
		Permissions: perms,
	}
}

func ToRoleList(roles []models.PlatformRole) []response.RoleResponse {
	res := make([]response.RoleResponse, 0, len(roles))
	for i := range roles {
		res = append(res, ToRoleResponse(&roles[i]))
	}
	return res
}
