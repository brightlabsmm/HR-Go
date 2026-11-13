package mapper

import (
	"strings"

	"hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/auth/response"
)

func ToWorkspaceUserProfile(acc *models.OrganizationAccount, perms []string) response.WorkspaceUserProfile {
	roles := make([]response.RoleAssignment, 0, len(acc.UserRoles))
	for _, ur := range acc.UserRoles {
		roles = append(roles, response.RoleAssignment{
			RoleCode:     ur.Role.Code,
			RoleName:     ur.Role.Name,
			BranchID:     ur.BranchID,
			DepartmentID: ur.DepartmentID,
		})
	}

	fullName := strings.TrimSpace(acc.Employee.FirstName + " " + acc.Employee.LastName)
	if fullName == "" {
		fullName = acc.Identifier
	}

	return response.WorkspaceUserProfile{
		OrganizationID:   acc.OrganizationID,
		OrganizationCode: acc.Organization.Code,
		AccountID:        acc.ID,
		EmployeeID:       acc.EmployeeID,
		EmployeeCode:     acc.Employee.EmployeeCode,
		FullName:         fullName,
		AccountStatus:    acc.Status,
		Roles:            roles,
		Permissions:      perms,
	}
}
