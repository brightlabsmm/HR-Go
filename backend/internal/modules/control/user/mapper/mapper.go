package mapper

import (
	"hrgo/backend/internal/modules/control/user/models"
	"hrgo/backend/internal/modules/control/user/response"
)

func ToPlatformUserResponse(u *models.PlatformUser) response.PlatformUserResponse {
	roles := make([]response.RoleSummary, 0, len(u.Roles))
	for _, r := range u.Roles {
		roles = append(roles, response.RoleSummary{
			ID:       r.ID,
			RoleCode: r.Code,
			RoleName: r.Name,
		})
	}
	return response.PlatformUserResponse{
		ID:          u.ID,
		FullName:    u.FullName,
		Email:       u.Email,
		Status:      u.Status,
		Roles:       roles,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}

func ToPlatformUserList(users []models.PlatformUser) []response.PlatformUserResponse {
	res := make([]response.PlatformUserResponse, 0, len(users))
	for i := range users {
		res = append(res, ToPlatformUserResponse(&users[i]))
	}
	return res
}
