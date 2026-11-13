package mapper

import (
	"hrgo/backend/internal/modules/control/auth/models"
	"hrgo/backend/internal/modules/control/auth/response"
)

func ToUserProfile(u *models.PlatformUser, perms []string) response.UserProfile {
	roles := make([]response.RoleSummary, 0, len(u.Roles))
	for _, r := range u.Roles {
		roles = append(roles, response.RoleSummary{
			RoleCode: r.Code,
			RoleName: r.Name,
		})
	}
	return response.UserProfile{
		ID:          u.ID,
		FullName:    u.FullName,
		Email:       u.Email,
		Status:      u.Status,
		Roles:       roles,
		Permissions: perms,
	}
}
