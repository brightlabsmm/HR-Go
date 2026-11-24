package mapper

import (
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/employee/models"
	"hrgo/backend/internal/modules/workspace/employee/response"
)

func ToEmployeeResponse(emp *models.Employee, profile *models.EmployeeProfile) response.EmployeeResponse {
	var dateOfJoining *string
	if emp.DateOfJoining != nil {
		s := emp.DateOfJoining.Format("2006-01-02")
		dateOfJoining = &s
	}

	fullName := strings.TrimSpace(emp.FirstName + " " + emp.LastName)

	res := response.EmployeeResponse{
		ID:               emp.ID,
		OrganizationID:   emp.OrganizationID,
		EmployeeCode:     emp.EmployeeCode,
		FirstName:        emp.FirstName,
		LastName:         emp.LastName,
		FullName:         fullName,
		Email:            emp.Email,
		Phone:            emp.Phone,
		BranchID:         emp.BranchID,
		BranchName:       nullableString(emp.BranchName),
		DepartmentID:     emp.DepartmentID,
		DepartmentName:   nullableString(emp.DepartmentName),
		PositionID:       emp.PositionID,
		PositionTitle:    nullableString(emp.PositionTitle),
		DateOfJoining:    dateOfJoining,
		EmploymentStatus: emp.EmploymentStatus,
		CreatedAt:        emp.CreatedAt,
		UpdatedAt:        emp.UpdatedAt,
	}

	if profile != nil {
		var dob *string
		if profile.DateOfBirth != nil {
			s := profile.DateOfBirth.Format("2006-01-02")
			dob = &s
		}
		res.Profile = &response.EmployeeProfileResponse{
			DateOfBirth:      dob,
			Gender:           profile.Gender,
			Nationality:      profile.Nationality,
			MaritalStatus:    profile.MaritalStatus,
			Address:          profile.Address,
			EmergencyContact: profile.EmergencyContact,
		}
	}

	return res
}

func ToPositionHistoryResponse(h *models.EmployeePositionHistory) response.PositionHistoryResponse {
	return response.PositionHistoryResponse{
		ID:               h.ID,
		EmployeeID:       h.EmployeeID,
		OldPositionID:    h.OldPositionID,
		OldPositionTitle: h.OldPositionTitle,
		NewPositionID:    h.NewPositionID,
		NewPositionTitle: h.NewPositionTitle,
		EffectiveDate:    h.EffectiveDate.Format("2006-01-02"),
		Remarks:          h.Remarks,
		CreatedAt:        h.CreatedAt,
	}
}

func ToPositionHistoryResponses(items []models.EmployeePositionHistory) []response.PositionHistoryResponse {
	result := make([]response.PositionHistoryResponse, len(items))
	for i := range items {
		result[i] = ToPositionHistoryResponse(&items[i])
	}
	return result
}

func nullableString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func ParseDate(s string) (*time.Time, error) {
	t, err := time.Parse("2006-01-02", strings.TrimSpace(s))
	if err != nil {
		return nil, err
	}
	return &t, nil
}
