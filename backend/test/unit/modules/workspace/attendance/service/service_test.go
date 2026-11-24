package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/repository"
	"hrgo/backend/internal/modules/workspace/attendance/request"
	"hrgo/backend/internal/modules/workspace/attendance/service"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
)

type mockAttendanceRepo struct {
	repository.Repository
	records     []models.AttendanceRecord
	corrections []models.AttendanceCorrectionRequest
	shift       *shiftmodels.Shift
}

func (m *mockAttendanceRepo) SaveAttendance(ctx context.Context, record *models.AttendanceRecord) error {
	for i := range m.records {
		if m.records[i].EmployeeID == record.EmployeeID && m.records[i].AttendanceDate.Format("2006-01-02") == record.AttendanceDate.Format("2006-01-02") {
			m.records[i] = *record
			return nil
		}
	}
	record.ID = "rec-1"
	record.CreatedAt = time.Now().UTC()
	record.UpdatedAt = time.Now().UTC()
	m.records = append(m.records, *record)
	return nil
}

func (m *mockAttendanceRepo) FindRecordByDate(ctx context.Context, orgID, employeeID string, date time.Time) (*models.AttendanceRecord, error) {
	dateStr := date.Format("2006-01-02")
	for i := range m.records {
		if m.records[i].EmployeeID == employeeID && m.records[i].AttendanceDate.Format("2006-01-02") == dateStr {
			return &m.records[i], nil
		}
	}
	return nil, nil
}

func (m *mockAttendanceRepo) FindRecordByID(ctx context.Context, orgID, id string) (*models.AttendanceRecord, error) {
	for i := range m.records {
		if m.records[i].ID == id {
			return &m.records[i], nil
		}
	}
	return nil, nil
}

func (m *mockAttendanceRepo) GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error) {
	return m.shift, nil
}

func (m *mockAttendanceRepo) ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) ([]models.AttendanceRecord, int64, error) {
	return m.records, int64(len(m.records)), nil
}

func (m *mockAttendanceRepo) CreateCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error {
	corr.ID = "corr-1"
	corr.CreatedAt = time.Now().UTC()
	corr.UpdatedAt = time.Now().UTC()
	m.corrections = append(m.corrections, *corr)
	return nil
}

func (m *mockAttendanceRepo) FindCorrectionByID(ctx context.Context, orgID, id string) (*models.AttendanceCorrectionRequest, error) {
	for i := range m.corrections {
		if m.corrections[i].ID == id {
			return &m.corrections[i], nil
		}
	}
	return nil, nil
}

func (m *mockAttendanceRepo) ApproveCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest, record *models.AttendanceRecord) error {
	corr.RequestStatus = "APPROVED"
	return nil
}

func TestAttendanceService_CheckInCheckOut(t *testing.T) {
	shift := &shiftmodels.Shift{
		ID:           "shift-1",
		ShiftName:    "Morning",
		StartTime:    "09:00",
		EndTime:      "18:00",
		BreakMinutes: 60,
	}
	repo := &mockAttendanceRepo{shift: shift}
	svc := service.New(repo)
	ctx := context.Background()

	now := time.Now().UTC().Format(time.RFC3339)
	inReq := request.CheckInRequest{
		EmployeeID:  "emp-1",
		CheckInTime: &now,
	}

	inRes, err := svc.CheckIn(ctx, "org-1", inReq)
	if err != nil {
		t.Fatalf("unexpected error checking in: %v", err)
	}
	if inRes.EmployeeID != "emp-1" {
		t.Errorf("expected emp-1, got %s", inRes.EmployeeID)
	}

	outReq := request.CheckOutRequest{
		EmployeeID:   "emp-1",
		CheckOutTime: &now,
	}
	outRes, err := svc.CheckOut(ctx, "org-1", outReq)
	if err != nil {
		t.Fatalf("unexpected error checking out: %v", err)
	}
	if outRes.CheckOut == nil {
		t.Errorf("expected check-out time to be populated")
	}
}
