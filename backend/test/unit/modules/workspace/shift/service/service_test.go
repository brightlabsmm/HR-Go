package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/shift/models"
	"hrgo/backend/internal/modules/workspace/shift/repository"
	"hrgo/backend/internal/modules/workspace/shift/request"
	"hrgo/backend/internal/modules/workspace/shift/service"
)

type mockShiftRepo struct {
	repository.Repository
	shifts         []models.Shift
	assignments    []models.EmployeeShiftAssignment
	rejectEmployee bool
	rejectBranch   bool
}

func (m *mockShiftRepo) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	return !m.rejectBranch, nil
}

func (m *mockShiftRepo) ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error) {
	return !m.rejectEmployee, nil
}

func (m *mockShiftRepo) CreateShift(ctx context.Context, shift *models.Shift) error {
	shift.ID = "shift-1"
	shift.CreatedAt = time.Now().UTC()
	shift.UpdatedAt = time.Now().UTC()
	m.shifts = append(m.shifts, *shift)
	return nil
}

func (m *mockShiftRepo) FindShiftByID(ctx context.Context, orgID, id string) (*models.Shift, error) {
	for i := range m.shifts {
		if m.shifts[i].ID == id {
			return &m.shifts[i], nil
		}
	}
	return nil, nil
}

func (m *mockShiftRepo) ListShifts(ctx context.Context, orgID string, q request.ListShiftsQuery) ([]models.Shift, int64, error) {
	return m.shifts, int64(len(m.shifts)), nil
}

func (m *mockShiftRepo) UnsetDefaultShift(ctx context.Context, orgID string) error {
	return nil
}

func (m *mockShiftRepo) CreateAssignment(ctx context.Context, a *models.EmployeeShiftAssignment, h *models.EmployeeShiftAssignmentHistory) error {
	a.ID = "assign-1"
	a.CreatedAt = time.Now().UTC()
	a.UpdatedAt = time.Now().UTC()
	m.assignments = append(m.assignments, *a)
	return nil
}

func (m *mockShiftRepo) FindCurrentAssignmentByEmployee(ctx context.Context, orgID, employeeID string, date time.Time) (*models.EmployeeShiftAssignment, error) {
	return nil, nil
}

func (m *mockShiftRepo) FindAssignmentByID(ctx context.Context, orgID, id string) (*models.EmployeeShiftAssignment, error) {
	for i := range m.assignments {
		if m.assignments[i].ID == id {
			return &m.assignments[i], nil
		}
	}
	return nil, nil
}

func (m *mockShiftRepo) ListAssignments(ctx context.Context, orgID string, q request.ListAssignmentsQuery) ([]models.EmployeeShiftAssignment, int64, error) {
	return m.assignments, int64(len(m.assignments)), nil
}

func TestShiftService_CreateAndAssign(t *testing.T) {
	repo := &mockShiftRepo{}
	svc := service.New(repo)
	ctx := context.Background()

	breakMin := 60
	isDef := true
	createReq := request.CreateShiftRequest{
		ShiftName:    "Standard Morning",
		StartTime:    "09:00",
		EndTime:      "18:00",
		BreakMinutes: &breakMin,
		IsDefault:    &isDef,
	}

	res, err := svc.CreateShift(ctx, "org-1", createReq)
	if err != nil {
		t.Fatalf("unexpected error creating shift: %v", err)
	}
	if res.ShiftName != "Standard Morning" {
		t.Errorf("expected Standard Morning, got %s", res.ShiftName)
	}

	assignReq := request.AssignShiftRequest{
		ShiftID:       res.ID,
		EffectiveFrom: "2026-11-01",
	}

	assignRes, err := svc.AssignShift(ctx, "org-1", "emp-1", assignReq)
	if err != nil {
		t.Fatalf("unexpected error assigning shift: %v", err)
	}
	if assignRes.ShiftID != res.ID {
		t.Errorf("expected shift ID %s, got %s", res.ID, assignRes.ShiftID)
	}
}
