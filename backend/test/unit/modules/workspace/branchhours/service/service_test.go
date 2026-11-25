package service_test

import (
	"context"
	"testing"

	"hrgo/backend/internal/modules/workspace/branchhours/models"
	"hrgo/backend/internal/modules/workspace/branchhours/request"
	"hrgo/backend/internal/modules/workspace/branchhours/service"
	"hrgo/backend/internal/shared/audit"
)

type fakeBranchHoursRepo struct {
	branchValid bool
	hours       []models.BranchOperatingHour
}

func (f *fakeBranchHoursRepo) ValidateBranch(_ context.Context, _, _ string) (bool, error) {
	return f.branchValid, nil
}

func (f *fakeBranchHoursRepo) ListByBranch(_ context.Context, _, _ string) ([]models.BranchOperatingHour, error) {
	return f.hours, nil
}

func (f *fakeBranchHoursRepo) ReplaceForBranch(_ context.Context, orgID, branchID string, items []models.BranchOperatingHour) ([]models.BranchOperatingHour, error) {
	for i := range items {
		items[i].ID = "bh-" + items[i].DayOfWeek
		items[i].OrganizationID = orgID
		items[i].BranchID = branchID
	}
	f.hours = items
	return items, nil
}

type fakeRecorder struct {
	entries []audit.RecordInput
}

func (f *fakeRecorder) Record(_ context.Context, input audit.RecordInput) error {
	f.entries = append(f.entries, input)
	return nil
}

func TestUpsertBranchOperatingHours(t *testing.T) {
	rec := &fakeRecorder{}
	repo := &fakeBranchHoursRepo{branchValid: true}
	svc := service.New(repo, rec)

	open := "09:00"
	closeT := "18:00"

	res, appErr := svc.Upsert(context.Background(), "org-1", "br-1", request.UpsertBranchOperatingHoursRequest{
		Hours: []request.OperatingHourItem{
			{DayOfWeek: "monday", OpeningTime: &open, ClosingTime: &closeT, IsClosed: false},
			{DayOfWeek: "SUNDAY", IsClosed: true},
		},
	}, audit.RecordInput{ActorID: "acc-1"})
	if appErr != nil {
		t.Fatalf("expected nil error, got %+v", appErr)
	}
	if len(res) != 2 || res[0].DayOfWeek != "MONDAY" {
		t.Fatalf("unexpected operating hours result: %+v", res)
	}
	if len(rec.entries) != 1 || rec.entries[0].Action != "UPSERT_OPERATING_HOURS" {
		t.Fatalf("expected audit log entry, got %+v", rec.entries)
	}

	// Reject cross-tenant branch
	repo.branchValid = false
	_, appErr = svc.List(context.Background(), "org-2", "br-1")
	if appErr == nil || appErr.Status != 404 {
		t.Fatalf("expected 404 for invalid org branch, got %+v", appErr)
	}
}
