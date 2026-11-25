package service_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/lifecycle/models"
	"hrgo/backend/internal/modules/workspace/lifecycle/repository"
	"hrgo/backend/internal/modules/workspace/lifecycle/request"
	"hrgo/backend/internal/modules/workspace/lifecycle/service"
	"hrgo/backend/internal/shared/audit"
)

type fakeLifecycleRepo struct {
	empValid          bool
	joinDate          *time.Time
	contracts         []models.EmploymentContract
	documents         []models.EmployeeDocument
	serviceYears      []models.EmployeeServiceYear
	exits             []models.EmployeeExitRecord
	histories         []models.EmployeeHistory
	deactivatedStatus string
}

func (f *fakeLifecycleRepo) ValidateEmployee(_ context.Context, _, _ string) (bool, error) {
	return f.empValid, nil
}

func (f *fakeLifecycleRepo) GetEmployeeSnapshotSource(_ context.Context, _, empID string) (*repository.EmployeeSnapshotSource, error) {
	return &repository.EmployeeSnapshotSource{
		EmployeeID:    empID,
		DateOfJoining: f.joinDate,
		Status:        "ACTIVE",
		EmployeeJSON:  json.RawMessage(`{"id":"` + empID + `"}`),
		ProfileJSON:   json.RawMessage(`{"nationality":"MM"}`),
	}, nil
}

func (f *fakeLifecycleRepo) ListContracts(_ context.Context, _, _ string) ([]models.EmploymentContract, error) {
	return f.contracts, nil
}
func (f *fakeLifecycleRepo) FindContractByID(_ context.Context, _, _, _ string) (*models.EmploymentContract, error) {
	if len(f.contracts) == 0 {
		return nil, nil
	}
	return &f.contracts[0], nil
}
func (f *fakeLifecycleRepo) CreateContract(_ context.Context, m *models.EmploymentContract) error {
	m.ID = "c-1"
	f.contracts = append(f.contracts, *m)
	return nil
}
func (f *fakeLifecycleRepo) UpdateContract(_ context.Context, m *models.EmploymentContract) error {
	f.contracts = []models.EmploymentContract{*m}
	return nil
}
func (f *fakeLifecycleRepo) SoftDeleteContract(_ context.Context, _, _, _ string) error {
	return nil
}
func (f *fakeLifecycleRepo) ListDocuments(_ context.Context, _, _ string) ([]models.EmployeeDocument, error) {
	return f.documents, nil
}
func (f *fakeLifecycleRepo) FindDocumentByID(_ context.Context, _, _, _ string) (*models.EmployeeDocument, error) {
	return nil, nil
}
func (f *fakeLifecycleRepo) CreateDocument(_ context.Context, m *models.EmployeeDocument) error {
	m.ID = "d-1"
	f.documents = append(f.documents, *m)
	return nil
}
func (f *fakeLifecycleRepo) SoftDeleteDocument(_ context.Context, _, _, _ string) error {
	return nil
}
func (f *fakeLifecycleRepo) ListServiceYears(_ context.Context, _, _ string) ([]models.EmployeeServiceYear, error) {
	return f.serviceYears, nil
}
func (f *fakeLifecycleRepo) UpsertServiceYear(_ context.Context, m *models.EmployeeServiceYear) error {
	m.ID = "sy-1"
	f.serviceYears = []models.EmployeeServiceYear{*m}
	return nil
}
func (f *fakeLifecycleRepo) ListExitRecords(_ context.Context, _, _ string) ([]models.EmployeeExitRecord, error) {
	return f.exits, nil
}
func (f *fakeLifecycleRepo) ListHistories(_ context.Context, _, _ string) ([]models.EmployeeHistory, error) {
	return f.histories, nil
}
func (f *fakeLifecycleRepo) RecordExitWithSnapshot(_ context.Context, exit *models.EmployeeExitRecord, hist *models.EmployeeHistory, newStatus string) error {
	exit.ID = "exit-1"
	hist.ID = "hist-1"
	f.exits = append(f.exits, *exit)
	f.histories = append(f.histories, *hist)
	f.deactivatedStatus = newStatus
	return nil
}

type stubRecorder struct {
	count int
}

func (s *stubRecorder) Record(_ context.Context, _ audit.RecordInput) error {
	s.count++
	return nil
}

func TestLifecycleServiceYearsAndExitSnapshot(t *testing.T) {
	join := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	repo := &fakeLifecycleRepo{empValid: true, joinDate: &join}
	rec := &stubRecorder{}
	svc := service.New(repo, rec)

	calcDate := "2026-01-01"
	sy, appErr := svc.RecalculateServiceYear(context.Background(), "org-1", "emp-1", request.RecalculateServiceYearRequest{
		CalculationDate: &calcDate,
	}, audit.RecordInput{ActorID: "acc-1"})
	if appErr != nil {
		t.Fatalf("unexpected error: %+v", appErr)
	}
	if sy.ServiceYears < 1.99 || sy.ServiceYears > 2.01 {
		t.Fatalf("expected ~2.0 service years, got %v", sy.ServiceYears)
	}

	reason := "Personal relocation"
	exit, appErr := svc.RecordExit(context.Background(), "org-1", "emp-1", "acc-1", request.RecordExitRequest{
		ExitType:      "RESIGNATION",
		EffectiveDate: "2026-12-01",
		Reason:        &reason,
	}, audit.RecordInput{ActorID: "acc-1"})
	if appErr != nil {
		t.Fatalf("unexpected error recording exit: %+v", appErr)
	}
	if exit.ExitType != "RESIGNATION" || repo.deactivatedStatus != "RESIGNED" {
		t.Fatalf("expected RESIGNED transition, got %s", repo.deactivatedStatus)
	}
	if len(repo.histories) != 1 || repo.histories[0].SnapshotReason != "RESIGNATION" {
		t.Fatalf("expected snapshot in employee_histories, got %+v", repo.histories)
	}
	if rec.count != 2 {
		t.Fatalf("expected 2 audit records, got %d", rec.count)
	}
}
