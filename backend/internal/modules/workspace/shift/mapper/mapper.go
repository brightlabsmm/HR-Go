package mapper

import (
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/shift/models"
	"hrgo/backend/internal/modules/workspace/shift/response"
)

func ToShiftResponse(shift *models.Shift) response.ShiftResponse {
	return response.ShiftResponse{
		ID:             shift.ID,
		OrganizationID: shift.OrganizationID,
		BranchID:       shift.BranchID,
		BranchName:     nullableString(shift.BranchName),
		ShiftName:      shift.ShiftName,
		StartTime:      shift.StartTime,
		EndTime:        shift.EndTime,
		BreakMinutes:   shift.BreakMinutes,
		Status:         shift.Status,
		IsDefault:      shift.IsDefault,
		CreatedAt:      shift.CreatedAt,
		UpdatedAt:      shift.UpdatedAt,
	}
}

func ToShiftResponses(items []models.Shift) []response.ShiftResponse {
	result := make([]response.ShiftResponse, len(items))
	for i := range items {
		result[i] = ToShiftResponse(&items[i])
	}
	return result
}

func ToAssignmentResponse(a *models.EmployeeShiftAssignment) response.AssignmentResponse {
	var effTo *string
	if a.EffectiveTo != nil {
		s := a.EffectiveTo.Format("2006-01-02")
		effTo = &s
	}

	return response.AssignmentResponse{
		ID:             a.ID,
		OrganizationID: a.OrganizationID,
		EmployeeID:     a.EmployeeID,
		EmployeeCode:   a.EmployeeCode,
		EmployeeName:   a.EmployeeName,
		ShiftID:        a.ShiftID,
		ShiftName:      a.ShiftName,
		StartTime:      a.StartTime,
		EndTime:        a.EndTime,
		EffectiveFrom:  a.EffectiveFrom.Format("2006-01-02"),
		EffectiveTo:    effTo,
		Status:         a.Status,
		CreatedAt:      a.CreatedAt,
		UpdatedAt:      a.UpdatedAt,
	}
}

func ToAssignmentResponses(items []models.EmployeeShiftAssignment) []response.AssignmentResponse {
	result := make([]response.AssignmentResponse, len(items))
	for i := range items {
		result[i] = ToAssignmentResponse(&items[i])
	}
	return result
}

func ToAssignmentHistoryResponse(h *models.EmployeeShiftAssignmentHistory) response.AssignmentHistoryResponse {
	var oldFrom, oldTo, newFrom, newTo *string
	if h.OldEffectiveFrom != nil {
		s := h.OldEffectiveFrom.Format("2006-01-02")
		oldFrom = &s
	}
	if h.OldEffectiveTo != nil {
		s := h.OldEffectiveTo.Format("2006-01-02")
		oldTo = &s
	}
	if h.NewEffectiveFrom != nil {
		s := h.NewEffectiveFrom.Format("2006-01-02")
		newFrom = &s
	}
	if h.NewEffectiveTo != nil {
		s := h.NewEffectiveTo.Format("2006-01-02")
		newTo = &s
	}

	return response.AssignmentHistoryResponse{
		ID:               h.ID,
		AssignmentID:     h.AssignmentID,
		EmployeeID:       h.EmployeeID,
		OldShiftID:       h.OldShiftID,
		OldShiftName:     nullableString(h.OldShiftName),
		NewShiftID:       h.NewShiftID,
		NewShiftName:     nullableString(h.NewShiftName),
		OldEffectiveFrom: oldFrom,
		OldEffectiveTo:   oldTo,
		NewEffectiveFrom: newFrom,
		NewEffectiveTo:   newTo,
		ChangedAt:        h.ChangedAt,
		Reason:           h.Reason,
	}
}

func ToAssignmentHistoryResponses(items []models.EmployeeShiftAssignmentHistory) []response.AssignmentHistoryResponse {
	result := make([]response.AssignmentHistoryResponse, len(items))
	for i := range items {
		result[i] = ToAssignmentHistoryResponse(&items[i])
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
