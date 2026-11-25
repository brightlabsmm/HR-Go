package mapper

import (
	"strings"
	"time"

	attendancemodels "hrgo/backend/internal/modules/workspace/attendance/models"
	authmodels "hrgo/backend/internal/modules/workspace/auth/models"
	employeemodels "hrgo/backend/internal/modules/workspace/employee/models"
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

func ToMobileUserProfile(
	acc *authmodels.OrganizationAccount,
	emp *employeemodels.Employee,
	profile *employeemodels.EmployeeProfile,
	posHistory []employeemodels.EmployeePositionHistory,
	perms []string,
) response.MobileUserProfile {
	roles := make([]string, 0, len(acc.UserRoles))
	for _, ur := range acc.UserRoles {
		if ur.Role.Code != "" {
			roles = append(roles, ur.Role.Code)
		}
	}

	var branchID, deptID, posID *string
	var branchName, deptName, posTitle string
	var phone, emailPtr, joinDate *string

	if len(acc.UserRoles) > 0 {
		branchID = acc.UserRoles[0].BranchID
		deptID = acc.UserRoles[0].DepartmentID
	}

	empCode := acc.Employee.EmployeeCode
	firstName := acc.Employee.FirstName
	lastName := acc.Employee.LastName
	empStatus := acc.Status

	if strings.TrimSpace(acc.Employee.Email) != "" {
		email := strings.TrimSpace(acc.Employee.Email)
		emailPtr = &email
	}

	if emp != nil {
		if emp.EmployeeCode != "" {
			empCode = emp.EmployeeCode
		}
		if emp.FirstName != "" {
			firstName = emp.FirstName
		}
		if emp.LastName != "" {
			lastName = emp.LastName
		}
		if emp.Email != nil && strings.TrimSpace(*emp.Email) != "" {
			em := strings.TrimSpace(*emp.Email)
			emailPtr = &em
		}
		phone = emp.Phone
		if emp.BranchID != nil {
			branchID = emp.BranchID
		}
		if emp.DepartmentID != nil {
			deptID = emp.DepartmentID
		}
		posID = emp.PositionID
		branchName = emp.BranchName
		deptName = emp.DepartmentName
		posTitle = emp.PositionTitle
		if emp.EmploymentStatus != "" {
			empStatus = emp.EmploymentStatus
		}
		if emp.DateOfJoining != nil {
			s := emp.DateOfJoining.Format("2006-01-02")
			joinDate = &s
		}
	}

	orgName := strings.TrimSpace(acc.Organization.DisplayName)
	if orgName == "" {
		orgName = strings.TrimSpace(acc.Organization.LegalName)
	}

	var personalProfile *response.MobileEmployeePersonalProfile
	if profile != nil {
		var dob *string
		if profile.DateOfBirth != nil {
			s := profile.DateOfBirth.Format("2006-01-02")
			dob = &s
		}
		personalProfile = &response.MobileEmployeePersonalProfile{
			DateOfBirth:      dob,
			Gender:           profile.Gender,
			Nationality:      profile.Nationality,
			MaritalStatus:    profile.MaritalStatus,
			Address:          profile.Address,
			EmergencyContact: profile.EmergencyContact,
		}
	}

	var histItems []response.MobilePositionHistoryItem
	if len(posHistory) > 0 {
		histItems = make([]response.MobilePositionHistoryItem, len(posHistory))
		for i, h := range posHistory {
			histItems[i] = response.MobilePositionHistoryItem{
				ID:               h.ID,
				OldPositionTitle: h.OldPositionTitle,
				NewPositionTitle: h.NewPositionTitle,
				EffectiveDate:    h.EffectiveDate.Format("2006-01-02"),
				Remarks:          h.Remarks,
			}
		}
	}

	return response.MobileUserProfile{
		AccountID:        acc.ID,
		EmployeeID:       acc.EmployeeID,
		EmployeeCode:     empCode,
		FirstName:        firstName,
		LastName:         lastName,
		Email:            emailPtr,
		Phone:            phone,
		BranchID:         branchID,
		BranchName:       branchName,
		DepartmentID:     deptID,
		DepartmentName:   deptName,
		PositionID:       posID,
		PositionTitle:    posTitle,
		DateOfJoining:    joinDate,
		EmploymentStatus: empStatus,
		Organization: response.MobileOrgInfo{
			ID:          acc.OrganizationID,
			Code:        acc.Organization.Code,
			LegalName:   acc.Organization.LegalName,
			DisplayName: orgName,
		},
		Roles:           roles,
		Permissions:     perms,
		Profile:         personalProfile,
		PositionHistory: histItems,
	}
}

func ToMobileShiftResponse(shift *shiftmodels.Shift, graceMinutes int, workDays []string) *response.MobileShiftResponse {
	if shift == nil {
		return nil
	}
	if graceMinutes < 0 {
		graceMinutes = 15
	}
	if len(workDays) == 0 {
		workDays = []string{"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
	}
	return &response.MobileShiftResponse{
		ID:                 shift.ID,
		ShiftName:          shift.ShiftName,
		StartTime:          shift.StartTime,
		EndTime:            shift.EndTime,
		BreakMinutes:       shift.BreakMinutes,
		GracePeriodMinutes: graceMinutes,
		WorkDays:           workDays,
	}
}

func ToMobileAttendanceRecordResponse(rec *attendancemodels.AttendanceRecord) response.MobileAttendanceRecordResponse {
	var shiftName *string
	if rec.ShiftName != "" {
		s := rec.ShiftName
		shiftName = &s
	}

	var checkInSource, checkOutSource *string
	if rec.Source != "" {
		src := rec.Source
		checkInSource = &src
		if rec.CheckOut != nil {
			checkOutSource = &src
		}
	}

	return response.MobileAttendanceRecordResponse{
		ID:                    rec.ID,
		OrganizationID:        rec.OrganizationID,
		EmployeeID:            rec.EmployeeID,
		ShiftID:               rec.ShiftID,
		ShiftName:             shiftName,
		AttendanceDate:        rec.AttendanceDate.Format("2006-01-02"),
		Status:                rec.AttendanceStatus,
		CheckInTime:           FormatTime(rec.CheckIn),
		CheckOutTime:          FormatTime(rec.CheckOut),
		CheckInSource:         checkInSource,
		CheckOutSource:        checkOutSource,
		WorkMinutes:           rec.WorkedMinutes,
		LateMinutes:           rec.LateMinutes,
		EarlyDepartureMinutes: rec.EarlyLeaveMinutes,
		OvertimeMinutes:       0,
		Notes:                 rec.Remarks,
		CreatedAt:             rec.CreatedAt,
		UpdatedAt:             rec.UpdatedAt,
	}
}

func ToMobileCorrectionResponse(row *models.MobileCorrectionRow) response.MobileCorrectionResponse {
	attID := ""
	if row.AttendanceID != nil {
		attID = *row.AttendanceID
	}
	return response.MobileCorrectionResponse{
		ID:                    row.ID,
		OrganizationID:        row.OrganizationID,
		EmployeeID:            row.EmployeeID,
		EmployeeCode:          row.EmployeeCode,
		EmployeeName:          row.EmployeeName,
		AttendanceRecordID:    attID,
		AttendanceDate:        row.AttendanceDate.Format("2006-01-02"),
		Status:                row.RequestStatus,
		RequestedCheckInTime:  FormatTime(row.RequestedCheckIn),
		RequestedCheckOutTime: FormatTime(row.RequestedCheckOut),
		OriginalCheckInTime:   FormatTime(row.OriginalCheckIn),
		OriginalCheckOutTime:  FormatTime(row.OriginalCheckOut),
		Reason:                row.Reason,
		ReviewerID:            row.ReviewedByAccountID,
		ReviewerName:          row.ReviewerName,
		ReviewedAt:            FormatTime(row.ReviewedAt),
		ReviewerNotes:         row.RejectionReason,
		CreatedAt:             row.CreatedAt,
		UpdatedAt:             row.UpdatedAt,
	}
}

func FormatTime(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}
