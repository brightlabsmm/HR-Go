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
	records      []models.AttendanceRecord
	corrections  []models.AttendanceCorrectionRequest
	shift        *shiftmodels.Shift
	timezone     string
	graceMinutes int
	rejectEmp    bool
}

func (m *mockAttendanceRepo) ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error) {
	return !m.rejectEmp, nil
}

func (m *mockAttendanceRepo) GetOrgTimezone(ctx context.Context, orgID string) (string, error) {
	if m.timezone == "" {
		return "UTC", nil
	}
	return m.timezone, nil
}

func (m *mockAttendanceRepo) GetGracePeriodMinutes(ctx context.Context, orgID string) (int, error) {
	if m.graceMinutes <= 0 {
		return 15, nil
	}
	return m.graceMinutes, nil
}

func (m *mockAttendanceRepo) FindShiftByID(ctx context.Context, orgID, shiftID string) (*shiftmodels.Shift, error) {
	if m.shift != nil && m.shift.ID == shiftID {
		return m.shift, nil
	}
	return nil, nil
}

func (m *mockAttendanceRepo) SaveAttendance(ctx context.Context, record *models.AttendanceRecord) error {
	for i := range m.records {
		if m.records[i].EmployeeID == record.EmployeeID && m.records[i].AttendanceDate.Format("2006-01-02") == record.AttendanceDate.Format("2006-01-02") {
			record.ID = m.records[i].ID
			m.records[i] = *record
			return nil
		}
	}
	if record.ID == "" {
		record.ID = "rec-1"
	}
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

func (m *mockAttendanceRepo) GetSummaryAggregate(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*repository.SummaryAggregate, error) {
	agg := &repository.SummaryAggregate{TotalDays: len(m.records)}
	for _, r := range m.records {
		switch r.AttendanceStatus {
		case "PRESENT", "EARLY_LEAVE":
			agg.PresentDays++
		case "LATE":
			agg.PresentDays++
			agg.LateDays++
		case "ABSENT":
			agg.AbsentDays++
		case "HALF_DAY":
			agg.HalfDays++
		}
		agg.TotalWorkedMinutes += r.WorkedMinutes
		agg.TotalLateMinutes += r.LateMinutes
	}
	return agg, nil
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
	return m.SaveAttendance(ctx, record)
}

func TestAttendanceService_CheckInWithExplicitShiftAndTimezone(t *testing.T) {
	shiftID := "00000000-0000-0000-0000-000000000010"
	shift := &shiftmodels.Shift{
		ID:           shiftID,
		ShiftName:    "Morning",
		StartTime:    "09:00",
		EndTime:      "18:00",
		BreakMinutes: 60,
	}
	repo := &mockAttendanceRepo{
		shift:        shift,
		timezone:     "Asia/Yangon",
		graceMinutes: 15,
	}
	svc := service.New(repo)
	ctx := context.Background()

	loc, _ := time.LoadLocation("Asia/Yangon")
	// 09:30 local Yangon -> 30 minutes late
	checkInStr := time.Date(2026, 11, 20, 9, 30, 0, 0, loc).UTC().Format(time.RFC3339)
	checkOutStr := time.Date(2026, 11, 20, 18, 0, 0, 0, loc).UTC().Format(time.RFC3339)

	inRes, appErr := svc.CheckIn(ctx, "org-1", request.CheckInRequest{
		EmployeeID:  "emp-1",
		ShiftID:     &shiftID,
		CheckInTime: &checkInStr,
	})
	if appErr != nil {
		t.Fatalf("unexpected error checking in: %v", appErr)
	}
	if inRes.LateMinutes != 30 || inRes.AttendanceStatus != "LATE" {
		t.Errorf("expected 30 late minutes and LATE status, got %d (%s)", inRes.LateMinutes, inRes.AttendanceStatus)
	}

	outRes, appErr := svc.CheckOut(ctx, "org-1", request.CheckOutRequest{
		EmployeeID:   "emp-1",
		CheckOutTime: &checkOutStr,
	})
	if appErr != nil {
		t.Fatalf("unexpected error checking out: %v", appErr)
	}
	// 8h30m (510m) minus 60m break = 450m
	if outRes.WorkedMinutes != 450 {
		t.Errorf("expected 450 worked minutes after break deduction, got %d", outRes.WorkedMinutes)
	}
}

func TestAttendanceService_PartialCorrectionPreservesCheckIn(t *testing.T) {
	loc := time.UTC
	shift := &shiftmodels.Shift{
		ID:           "shift-1",
		ShiftName:    "Morning",
		StartTime:    "09:00",
		EndTime:      "18:00",
		BreakMinutes: 60,
	}
	existingIn := time.Date(2026, 11, 20, 9, 0, 0, 0, loc)
	attDate := time.Date(2026, 11, 20, 0, 0, 0, 0, loc)
	repo := &mockAttendanceRepo{
		shift: shift,
		records: []models.AttendanceRecord{
			{
				ID:             "rec-1",
				OrganizationID: "org-1",
				EmployeeID:     "emp-1",
				ShiftID:        &shift.ID,
				AttendanceDate: attDate,
				CheckIn:        &existingIn,
			},
		},
	}
	svc := service.New(repo)
	ctx := context.Background()

	reqOut := "2026-11-20T18:00:00Z"
	attID := "rec-1"
	corrRes, appErr := svc.SubmitCorrection(ctx, "org-1", request.CreateCorrectionRequest{
		EmployeeID:        "emp-1",
		AttendanceID:      &attID,
		AttendanceDate:    "2026-11-20",
		RequestedCheckOut: &reqOut,
		Reason:            "Forgot to punch out",
	})
	if appErr != nil {
		t.Fatalf("unexpected error submitting partial correction: %v", appErr)
	}

	if _, appErr := svc.ReviewCorrection(ctx, "org-1", "acc-admin", corrRes.ID, request.ReviewCorrectionRequest{
		Decision: "APPROVED",
	}); appErr != nil {
		t.Fatalf("unexpected error approving correction: %v", appErr)
	}

	if repo.records[0].CheckIn == nil || !repo.records[0].CheckIn.Equal(existingIn) {
		t.Errorf("expected existing check-in %v to be preserved, got %v", existingIn, repo.records[0].CheckIn)
	}
	if repo.records[0].WorkedMinutes != 480 {
		t.Errorf("expected 480 worked minutes (9h - 1h break), got %d", repo.records[0].WorkedMinutes)
	}
}
