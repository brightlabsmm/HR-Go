package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/leave/models"
	"hrgo/backend/internal/modules/workspace/leave/repository"
	"hrgo/backend/internal/modules/workspace/leave/request"
	"hrgo/backend/internal/modules/workspace/leave/service"
)

type fakeLeaveRepo struct {
	empValid   bool
	lt         models.LeaveType
	rule       *models.LeaveRule
	bal        models.LeaveBalance
	req        *models.LeaveRequest
	reviewed   bool
	reviewStat string
}

func (f *fakeLeaveRepo) ValidateEmployee(_ context.Context, _, _ string) (bool, error) {
	return f.empValid, nil
}
func (f *fakeLeaveRepo) ListLeaveTypes(_ context.Context, _ string, _ bool) ([]models.LeaveType, error) {
	return []models.LeaveType{f.lt}, nil
}
func (f *fakeLeaveRepo) FindLeaveTypeByID(_ context.Context, _, _ string) (*models.LeaveType, error) {
	return &f.lt, nil
}
func (f *fakeLeaveRepo) FindLeaveRuleByType(_ context.Context, _ string) (*models.LeaveRule, error) {
	return f.rule, nil
}
func (f *fakeLeaveRepo) CreateLeaveTypeWithRule(_ context.Context, lt *models.LeaveType, _ *models.LeaveRule) error {
	lt.ID = "lt-1"
	return nil
}
func (f *fakeLeaveRepo) UpdateLeaveType(_ context.Context, _ *models.LeaveType) error { return nil }
func (f *fakeLeaveRepo) EnsureEmployeeBalancesForYear(_ context.Context, _, _ string, _ int) error {
	return nil
}
func (f *fakeLeaveRepo) ListBalances(_ context.Context, _ string, _ request.ListLeaveBalancesQuery) ([]models.LeaveBalance, error) {
	return []models.LeaveBalance{f.bal}, nil
}
func (f *fakeLeaveRepo) FindBalance(_ context.Context, _, _, _ string, _ int) (*models.LeaveBalance, error) {
	return &f.bal, nil
}
func (f *fakeLeaveRepo) ApplyBalanceAdjustment(_ context.Context, _, _, _ string, _ int, days float64, _ string, _ *string) (*models.LeaveBalance, error) {
	f.bal.AllocatedDays += days
	f.bal.RemainingDays += days
	return &f.bal, nil
}
func (f *fakeLeaveRepo) ListRequests(_ context.Context, _ string, _ request.ListLeaveRequestsQuery) ([]models.LeaveRequest, int64, error) {
	if f.req == nil {
		return nil, 0, nil
	}
	return []models.LeaveRequest{*f.req}, 1, nil
}
func (f *fakeLeaveRepo) FindRequestByID(_ context.Context, _, _ string) (*models.LeaveRequest, error) {
	return f.req, nil
}
func (f *fakeLeaveRepo) CreateRequestWithReserve(_ context.Context, req *models.LeaveRequest, _ *string) error {
	req.ID = "lr-1"
	f.bal.PendingDays += req.RequestedDays
	f.bal.RemainingDays -= req.RequestedDays
	f.req = req
	return nil
}
func (f *fakeLeaveRepo) ReviewRequestTx(_ context.Context, _ string, lr *models.LeaveRequest, _ *models.LeaveApproval, _ int, _ bool) error {
	f.reviewed = true
	f.reviewStat = lr.RequestStatus
	f.bal.PendingDays -= lr.RequestedDays
	if lr.RequestStatus == "APPROVED" {
		f.bal.UsedDays += lr.RequestedDays
	} else {
		f.bal.RemainingDays += lr.RequestedDays
	}
	return nil
}
func (f *fakeLeaveRepo) CancelRequestTx(_ context.Context, _ string, _ *models.LeaveRequest, _ int, _ bool) error {
	return nil
}

var _ repository.Repository = (*fakeLeaveRepo)(nil)

func TestLeaveRequestReserveAndApproveFlow(t *testing.T) {
	repo := &fakeLeaveRepo{
		empValid: true,
		lt: models.LeaveType{
			ID: "lt-1", Code: "ANNUAL", Name: "Annual Leave",
			RequiresBalance: true, AnnualAllowance: 10, Status: "ACTIVE",
		},
		rule: &models.LeaveRule{AllowHalfDay: true},
		bal: models.LeaveBalance{
			ID: "bal-1", AllocatedDays: 10, RemainingDays: 10, BalanceYear: 2026,
		},
	}
	svc := service.New(repo)

	created, appErr := svc.CreateRequest(context.Background(), "org-1", "emp-1", request.CreateLeaveRequest{
		LeaveTypeID: "lt-1",
		StartDate:   "2026-12-10",
		EndDate:     "2026-12-11",
		IsHalfDay:   true,
		Reason:      "Family trip",
	})
	if appErr != nil {
		t.Fatalf("unexpected error creating leave request: %+v", appErr)
	}
	if created.RequestedDays != 1.5 || repo.bal.PendingDays != 1.5 || repo.bal.RemainingDays != 8.5 {
		t.Fatalf("expected 1.5 reserved days, got days=%v bal=%+v", created.RequestedDays, repo.bal)
	}

	// Reject insufficient balance
	_, appErr = svc.CreateRequest(context.Background(), "org-1", "emp-1", request.CreateLeaveRequest{
		LeaveTypeID: "lt-1",
		StartDate:   "2026-12-01",
		EndDate:     "2026-12-20",
		Reason:      "Long holiday",
	})
	if appErr == nil || appErr.Status != 409 {
		t.Fatalf("expected 409 insufficient balance, got %+v", appErr)
	}

	// Approve first request
	repo.req.StartDate = time.Date(2026, 12, 10, 0, 0, 0, 0, time.UTC)
	rev, appErr := svc.ReviewRequest(context.Background(), "org-1", "lr-1", "acc-1", request.ReviewLeaveRequest{Decision: "APPROVED"})
	if appErr != nil {
		t.Fatalf("unexpected review error: %+v", appErr)
	}
	if rev.RequestStatus != "APPROVED" || repo.bal.UsedDays != 1.5 || repo.bal.PendingDays != 0 {
		t.Fatalf("unexpected post-approval balance: %+v", repo.bal)
	}
}
