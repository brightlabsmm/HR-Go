package mapper

import (
	"strings"
	"time"

	authmodels "hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/mobile/models"
	"hrgo/backend/internal/modules/workspace/mobile/response"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
)

func ToMobileDeviceResponse(dev *models.MobileDevice) response.MobileDeviceResponse {
	return response.MobileDeviceResponse{
		ID:               dev.ID,
		DeviceIdentifier: dev.DeviceIdentifier,
		DeviceName:       dev.DeviceName,
		Status:           dev.Status,
	}
}

func ToMobileUserProfile(acc *authmodels.OrganizationAccount, perms []string) response.MobileUserProfile {
	roles := make([]string, 0, len(acc.UserRoles))
	for _, ur := range acc.UserRoles {
		roles = append(roles, ur.Role.Code)
	}

	var branchID, deptID *string
	if len(acc.UserRoles) > 0 {
		branchID = acc.UserRoles[0].BranchID
		deptID = acc.UserRoles[0].DepartmentID
	}

	orgName := strings.TrimSpace(acc.Organization.DisplayName)
	if orgName == "" {
		orgName = strings.TrimSpace(acc.Organization.LegalName)
	}

	var emailPtr *string
	if strings.TrimSpace(acc.Employee.Email) != "" {
		email := strings.TrimSpace(acc.Employee.Email)
		emailPtr = &email
	}

	return response.MobileUserProfile{
		AccountID:        acc.ID,
		EmployeeID:       acc.EmployeeID,
		EmployeeCode:     acc.Employee.EmployeeCode,
		FirstName:        acc.Employee.FirstName,
		LastName:         acc.Employee.LastName,
		Email:            emailPtr,
		BranchID:         branchID,
		DepartmentID:     deptID,
		EmploymentStatus: acc.Status,
		Organization: response.MobileOrgInfo{
			ID:          acc.OrganizationID,
			Code:        acc.Organization.Code,
			LegalName:   acc.Organization.LegalName,
			DisplayName: orgName,
		},
		Roles:       roles,
		Permissions: perms,
	}
}

func ToMobileShiftResponse(shift *shiftmodels.Shift) *response.MobileShiftResponse {
	if shift == nil {
		return nil
	}
	return &response.MobileShiftResponse{
		ID:                 shift.ID,
		ShiftName:          shift.ShiftName,
		StartTime:          shift.StartTime,
		EndTime:            shift.EndTime,
		GracePeriodMinutes: 15,
		WorkDays:           []string{"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"},
	}
}

func FormatTime(t *time.Time) *string {
	if t == nil {
		return nil
	}
	formatted := t.UTC().Format(time.RFC3339)
	return &formatted
}
