package mapper

import (
	"strings"

	"hrgo/backend/internal/modules/workspace/user/models"
	"hrgo/backend/internal/modules/workspace/user/response"
)

func ToWorkspaceUserResponse(acc *models.OrganizationAccount) response.WorkspaceUserResponse {
	fullName := strings.TrimSpace(acc.Employee.FirstName + " " + acc.Employee.LastName)
	if fullName == "" {
		fullName = acc.Identifier
	}

	email := acc.Employee.Email
	if email == "" && strings.Contains(acc.Identifier, "@") {
		email = acc.Identifier
	}

	roles := make([]response.RoleSummary, 0, len(acc.UserRoles))
	for _, ur := range acc.UserRoles {
		roles = append(roles, response.RoleSummary{
			ID:       ur.Role.ID,
			RoleCode: ur.Role.Code,
			RoleName: ur.Role.Name,
		})
	}

	return response.WorkspaceUserResponse{
		ID:          acc.ID,
		FullName:    fullName,
		Email:       email,
		Status:      acc.Status,
		Roles:       roles,
		LastLoginAt: acc.LastLoginAt,
		CreatedAt:   acc.CreatedAt,
		UpdatedAt:   acc.UpdatedAt,
	}
}

func ToWorkspaceUserList(accounts []models.OrganizationAccount) []response.WorkspaceUserResponse {
	res := make([]response.WorkspaceUserResponse, 0, len(accounts))
	for i := range accounts {
		res = append(res, ToWorkspaceUserResponse(&accounts[i]))
	}
	return res
}
