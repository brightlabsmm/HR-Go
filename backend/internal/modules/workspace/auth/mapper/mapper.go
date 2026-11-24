package mapper

import (
	"strings"
	"time"

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

	orgName := strings.TrimSpace(acc.Organization.DisplayName)
	if orgName == "" {
		orgName = strings.TrimSpace(acc.Organization.LegalName)
	}

	var notice *response.SuspensionNotice
	now := time.Now()
	if isNoticeActive(&acc.Organization, now) {
		reason := ""
		if acc.Organization.SuspendReason != nil {
			reason = *acc.Organization.SuspendReason
		}
		notice = &response.SuspensionNotice{
			ScheduledSuspendAt: acc.Organization.ScheduledSuspendAt.UTC().Format(time.RFC3339),
			Reason:             reason,
		}
	}

	return response.WorkspaceUserProfile{
		OrganizationID:     acc.OrganizationID,
		OrganizationName:   orgName,
		AccountID:          acc.ID,
		EmployeeID:         acc.EmployeeID,
		EmployeeCode:       acc.Employee.EmployeeCode,
		FullName:           fullName,
		AccountStatus:      acc.Status,
		MustChangePassword: acc.MustChangePassword,
		Roles:              roles,
		Permissions:        perms,
		SuspensionNotice:   notice,
	}
}

func isNoticeActive(org *models.Organization, now time.Time) bool {
	if org == nil || org.ScheduledSuspendAt == nil {
		return false
	}
	if now.After(*org.ScheduledSuspendAt) {
		return false
	}
	if org.SuspendNotifyFrom != nil && now.Before(*org.SuspendNotifyFrom) {
		return false
	}
	if org.SuspendNotifyTo != nil && now.After(*org.SuspendNotifyTo) {
		return false
	}
	return true
}
