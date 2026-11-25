package mapper

import (
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/response"
)

func ToAttendanceResponse(r *models.AttendanceRecord) response.AttendanceResponse {
	var checkIn, checkOut *string
	if r.CheckIn != nil {
		s := r.CheckIn.Format(time.RFC3339)
		checkIn = &s
	}
	if r.CheckOut != nil {
		s := r.CheckOut.Format(time.RFC3339)
		checkOut = &s
	}

	return response.AttendanceResponse{
		ID:                r.ID,
		OrganizationID:    r.OrganizationID,
		EmployeeID:        r.EmployeeID,
		EmployeeCode:      r.EmployeeCode,
		EmployeeName:      r.EmployeeName,
		ShiftID:           r.ShiftID,
		ShiftName:         nullableString(r.ShiftName),
		BranchName:        nullableString(r.BranchName),
		DepartmentName:    nullableString(r.DepartmentName),
		AttendanceDate:    r.AttendanceDate.Format("2006-01-02"),
		CheckIn:           checkIn,
		CheckOut:          checkOut,
		AttendanceStatus:  r.AttendanceStatus,
		LateMinutes:       r.LateMinutes,
		EarlyLeaveMinutes: r.EarlyLeaveMinutes,
		WorkedMinutes:     r.WorkedMinutes,
		Source:            r.Source,
		Remarks:           r.Remarks,
		CreatedAt:         r.CreatedAt,
		UpdatedAt:         r.UpdatedAt,
	}
}

func ToAttendanceResponses(items []models.AttendanceRecord) []response.AttendanceResponse {
	result := make([]response.AttendanceResponse, len(items))
	for i := range items {
		result[i] = ToAttendanceResponse(&items[i])
	}
	return result
}

func ToCorrectionResponse(c *models.AttendanceCorrectionRequest) response.CorrectionResponse {
	var reqIn, reqOut, revAt *string
	if c.RequestedCheckIn != nil {
		s := c.RequestedCheckIn.Format(time.RFC3339)
		reqIn = &s
	}
	if c.RequestedCheckOut != nil {
		s := c.RequestedCheckOut.Format(time.RFC3339)
		reqOut = &s
	}
	if c.ReviewedAt != nil {
		s := c.ReviewedAt.Format(time.RFC3339)
		revAt = &s
	}

	return response.CorrectionResponse{
		ID:                  c.ID,
		OrganizationID:      c.OrganizationID,
		AttendanceID:        c.AttendanceID,
		EmployeeID:          c.EmployeeID,
		EmployeeCode:        c.EmployeeCode,
		EmployeeName:        c.EmployeeName,
		AttendanceDate:      c.AttendanceDate.Format("2006-01-02"),
		RequestedCheckIn:    reqIn,
		RequestedCheckOut:   reqOut,
		Reason:              c.Reason,
		RequestStatus:       c.RequestStatus,
		ReviewedByAccountID: c.ReviewedByAccountID,
		ReviewerName:        nullableString(c.ReviewerName),
		ReviewedAt:          revAt,
		RejectionReason:     c.RejectionReason,
		CreatedAt:           c.CreatedAt,
		UpdatedAt:           c.UpdatedAt,
	}
}

func ToCorrectionResponses(items []models.AttendanceCorrectionRequest) []response.CorrectionResponse {
	result := make([]response.CorrectionResponse, len(items))
	for i := range items {
		result[i] = ToCorrectionResponse(&items[i])
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

func ParseDateTime(s string) (*time.Time, error) {
	str := strings.TrimSpace(s)
	t, err := time.Parse(time.RFC3339, str)
	if err == nil {
		return &t, nil
	}
	t, err = time.Parse("2006-01-02 15:04:05", str)
	if err == nil {
		return &t, nil
	}
	t, err = time.Parse("2006-01-02 15:04", str)
	if err == nil {
		return &t, nil
	}
	return nil, err
}
