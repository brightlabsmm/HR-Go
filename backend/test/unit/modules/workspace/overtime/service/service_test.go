package service_test

import (
	"context"
	"testing"

	"hrgo/backend/internal/modules/workspace/overtime/models"
	"hrgo/backend/internal/modules/workspace/overtime/repository"
	"hrgo/backend/internal/modules/workspace/overtime/request"
	"hrgo/backend/internal/modules/workspace/overtime/service"
)

type fakeOTRepo struct {
	empValid bool
	cat      repository.CategoryWithRule
	req      *models.OvertimeRequest
	entry    *models.OvertimeEntry
}

func (f *fakeOTRepo) ValidateEmployee(_ context.Context, _, _ string) (bool, error) {
	return f.empValid, nil
}
func (f *fakeOTRepo) ListCategories(_ context.Context, _ string, _ bool) ([]repository.CategoryWithRule, error) {
	return []repository.CategoryWithRule{f.cat}, nil
}
func (f *fakeOTRepo) FindCategoryByID(_ context.Context, _, _ string) (*repository.CategoryWithRule, error) {
	return &f.cat, nil
}
func (f *fakeOTRepo) CreateCategoryWithRule(_ context.Context, cat *models.OvertimeCategory, _ *models.OvertimeRule) error {
	cat.ID = "cat-1"
	return nil
}
func (f *fakeOTRepo) ListRequests(_ context.Context, _ string, _ request.ListOvertimeRequestsQuery) ([]models.OvertimeRequest, int64, error) {
	if f.req == nil {
		return nil, 0, nil
	}
	return []models.OvertimeRequest{*f.req}, 1, nil
}
func (f *fakeOTRepo) FindRequestByID(_ context.Context, _, _ string) (*models.OvertimeRequest, error) {
	return f.req, nil
}
func (f *fakeOTRepo) CreateRequest(_ context.Context, req *models.OvertimeRequest) error {
	req.ID = "ot-1"
	req.Multiplier = f.cat.RateMultiplier
	f.req = req
	return nil
}
func (f *fakeOTRepo) ReviewRequestTx(_ context.Context, _ string, _ *models.OvertimeRequest, _ *models.OvertimeApproval, entry *models.OvertimeEntry) error {
	f.entry = entry
	return nil
}
func (f *fakeOTRepo) ListEntries(_ context.Context, _, _ string) ([]models.OvertimeEntry, error) {
	if f.entry == nil {
		return nil, nil
	}
	return []models.OvertimeEntry{*f.entry}, nil
}

func TestOvertimeRequestAndApprovalCreatesEntry(t *testing.T) {
	repo := &fakeOTRepo{
		empValid: true,
		cat: repository.CategoryWithRule{
			OvertimeCategory: models.OvertimeCategory{ID: "cat-1", Code: "WEEKDAY", Name: "Weekday OT", RateMultiplier: 1.5},
			MinMinutes:       30,
			MaxDailyMinutes:  480,
		},
	}
	svc := service.New(repo)

	created, appErr := svc.CreateRequest(context.Background(), "org-1", "emp-1", request.CreateOvertimeRequest{
		OvertimeCategoryID: "cat-1",
		WorkDate:           "2026-11-26",
		StartTime:          "17:30",
		EndTime:            "20:00",
		Reason:             "Month-end closing",
	})
	if appErr != nil {
		t.Fatalf("unexpected error: %+v", appErr)
	}
	if created.RequestedMinutes != 150 {
		t.Fatalf("expected 150 requested minutes, got %d", created.RequestedMinutes)
	}

	rev, appErr := svc.ReviewRequest(context.Background(), "org-1", "ot-1", "acc-1", request.ReviewOvertimeRequest{Decision: "APPROVED"})
	if appErr != nil {
		t.Fatalf("unexpected review error: %+v", appErr)
	}
	if rev.RequestStatus != "APPROVED" || repo.entry == nil || repo.entry.ApprovedMinutes != 150 {
		t.Fatalf("expected approved overtime entry of 150m, got %+v", repo.entry)
	}
}
