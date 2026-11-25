package service

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/leave/models"
	"hrgo/backend/internal/modules/workspace/leave/repository"
	"hrgo/backend/internal/modules/workspace/leave/request"
	"hrgo/backend/internal/modules/workspace/leave/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	ListTypes(ctx context.Context, orgID string, activeOnly bool) ([]response.LeaveTypeResponse, *apperrors.Error)
	CreateType(ctx context.Context, orgID string, req request.CreateLeaveTypeRequest) (*response.LeaveTypeResponse, *apperrors.Error)
	UpdateType(ctx context.Context, orgID, id string, req request.UpdateLeaveTypeRequest) (*response.LeaveTypeResponse, *apperrors.Error)

	ListBalances(ctx context.Context, orgID string, q request.ListLeaveBalancesQuery, ensureSelf bool) ([]response.LeaveBalanceResponse, *apperrors.Error)
	AdjustBalance(ctx context.Context, orgID, actorAccountID string, req request.AdjustLeaveBalanceRequest) (*response.LeaveBalanceResponse, *apperrors.Error)

	ListRequests(ctx context.Context, orgID string, q request.ListLeaveRequestsQuery) ([]response.LeaveRequestResponse, int64, *apperrors.Error)
	CreateRequest(ctx context.Context, orgID, actorEmployeeID string, req request.CreateLeaveRequest) (*response.LeaveRequestResponse, *apperrors.Error)
	ReviewRequest(ctx context.Context, orgID, id, actorAccountID string, req request.ReviewLeaveRequest) (*response.LeaveRequestResponse, *apperrors.Error)
	CancelOwnRequest(ctx context.Context, orgID, id, employeeID string) (*response.LeaveRequestResponse, *apperrors.Error)
}

type svc struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &svc{repo: repo}
}

func (s *svc) ListTypes(ctx context.Context, orgID string, activeOnly bool) ([]response.LeaveTypeResponse, *apperrors.Error) {
	rows, err := s.repo.ListLeaveTypes(ctx, orgID, activeOnly)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.LeaveTypeResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toTypeResp(r))
	}
	return out, nil
}

func (s *svc) CreateType(ctx context.Context, orgID string, req request.CreateLeaveTypeRequest) (*response.LeaveTypeResponse, *apperrors.Error) {
	isPaid := true
	if req.IsPaid != nil {
		isPaid = *req.IsPaid
	}
	requiresBalance := true
	if req.RequiresBalance != nil {
		requiresBalance = *req.RequiresBalance
	}
	allowHalfDay := true
	if req.AllowHalfDay != nil {
		allowHalfDay = *req.AllowHalfDay
	}

	now := time.Now().UTC()
	lt := &models.LeaveType{
		OrganizationID:  orgID,
		Code:            strings.ToUpper(strings.TrimSpace(req.Code)),
		Name:            strings.TrimSpace(req.Name),
		Description:     req.Description,
		IsPaid:          isPaid,
		RequiresBalance: requiresBalance,
		AnnualAllowance: req.AnnualAllowance,
		Status:          "ACTIVE",
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	rule := &models.LeaveRule{
		MinNoticeDays:      req.MinNoticeDays,
		MaxConsecutiveDays: req.MaxConsecutiveDays,
		AllowHalfDay:       allowHalfDay,
		CarryOverLimit:     req.CarryOverLimit,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	if err := s.repo.CreateLeaveTypeWithRule(ctx, lt, rule); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, apperrors.Conflict("A leave type with this code already exists.")
		}
		return nil, apperrors.Internal()
	}

	res := toTypeResp(*lt)
	return &res, nil
}

func (s *svc) UpdateType(ctx context.Context, orgID, id string, req request.UpdateLeaveTypeRequest) (*response.LeaveTypeResponse, *apperrors.Error) {
	lt, err := s.repo.FindLeaveTypeByID(ctx, orgID, id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Leave type not found.")
		}
		return nil, apperrors.Internal()
	}
	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		lt.Name = strings.TrimSpace(*req.Name)
	}
	if req.Description != nil {
		lt.Description = req.Description
	}
	if req.IsPaid != nil {
		lt.IsPaid = *req.IsPaid
	}
	if req.RequiresBalance != nil {
		lt.RequiresBalance = *req.RequiresBalance
	}
	if req.AnnualAllowance != nil && *req.AnnualAllowance >= 0 {
		lt.AnnualAllowance = *req.AnnualAllowance
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		lt.Status = strings.ToUpper(strings.TrimSpace(*req.Status))
	}
	lt.UpdatedAt = time.Now().UTC()

	if err := s.repo.UpdateLeaveType(ctx, lt); err != nil {
		return nil, apperrors.Internal()
	}
	res := toTypeResp(*lt)
	return &res, nil
}

func (s *svc) ListBalances(ctx context.Context, orgID string, q request.ListLeaveBalancesQuery, ensureSelf bool) ([]response.LeaveBalanceResponse, *apperrors.Error) {
	if q.Year <= 0 {
		q.Year = time.Now().UTC().Year()
	}
	if ensureSelf && q.EmployeeID != "" {
		if err := s.repo.EnsureEmployeeBalancesForYear(ctx, orgID, q.EmployeeID, q.Year); err != nil {
			return nil, apperrors.Internal()
		}
	}
	rows, err := s.repo.ListBalances(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.LeaveBalanceResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toBalanceResp(r))
	}
	return out, nil
}

func (s *svc) AdjustBalance(ctx context.Context, orgID, actorAccountID string, req request.AdjustLeaveBalanceRequest) (*response.LeaveBalanceResponse, *apperrors.Error) {
	ok, err := s.repo.ValidateEmployee(ctx, orgID, req.EmployeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !ok {
		return nil, apperrors.NotFound("Employee not found in organization.")
	}
	if _, err := s.repo.FindLeaveTypeByID(ctx, orgID, req.LeaveTypeID); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Leave type not found in organization.")
		}
		return nil, apperrors.Internal()
	}
	var actorPtr *string
	if actorAccountID != "" {
		actorPtr = &actorAccountID
	}
	bal, err := s.repo.ApplyBalanceAdjustment(ctx, orgID, req.EmployeeID, req.LeaveTypeID, req.BalanceYear, req.AdjustmentDays, strings.TrimSpace(req.Reason), actorPtr)
	if err != nil {
		return nil, apperrors.Internal()
	}
	res := toBalanceResp(*bal)
	return &res, nil
}

func (s *svc) ListRequests(ctx context.Context, orgID string, q request.ListLeaveRequestsQuery) ([]response.LeaveRequestResponse, int64, *apperrors.Error) {
	rows, total, err := s.repo.ListRequests(ctx, orgID, q)
	if err != nil {
		return nil, 0, apperrors.Internal()
	}
	out := make([]response.LeaveRequestResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toReqResp(r))
	}
	return out, total, nil
}

func (s *svc) CreateRequest(ctx context.Context, orgID, actorEmployeeID string, req request.CreateLeaveRequest) (*response.LeaveRequestResponse, *apperrors.Error) {
	employeeID := strings.TrimSpace(req.EmployeeID)
	if employeeID == "" {
		employeeID = actorEmployeeID
	}
	if employeeID == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "employeeId", Message: "employeeId is required."}})
	}

	ok, err := s.repo.ValidateEmployee(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if !ok {
		return nil, apperrors.NotFound("Employee not found in organization.")
	}

	lt, err := s.repo.FindLeaveTypeByID(ctx, orgID, req.LeaveTypeID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Leave type not found.")
		}
		return nil, apperrors.Internal()
	}
	if lt.Status != "ACTIVE" {
		return nil, apperrors.BadRequest("This leave type is inactive.")
	}

	startDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.StartDate))
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "startDate", Message: "startDate must be YYYY-MM-DD."}})
	}
	endDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.EndDate))
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate must be YYYY-MM-DD."}})
	}
	if endDate.Before(startDate) {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "endDate cannot be earlier than startDate."}})
	}

	totalDays := endDate.Sub(startDate).Hours()/24.0 + 1.0
	if req.IsHalfDay {
		totalDays -= 0.5
		if totalDays < 0.5 {
			totalDays = 0.5
		}
	}

	if rule, rErr := s.repo.FindLeaveRuleByType(ctx, lt.ID); rErr == nil && rule != nil {
		if req.IsHalfDay && !rule.AllowHalfDay {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "isHalfDay", Message: "Half-day requests are not allowed for this leave type."}})
		}
		if rule.MaxConsecutiveDays != nil && totalDays > float64(*rule.MaxConsecutiveDays) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endDate", Message: "Requested duration exceeds maximum consecutive leave days."}})
		}
	}

	var reserveBalanceID *string
	if lt.RequiresBalance {
		if err := s.repo.EnsureEmployeeBalancesForYear(ctx, orgID, employeeID, startDate.Year()); err != nil {
			return nil, apperrors.Internal()
		}
		bal, bErr := s.repo.FindBalance(ctx, orgID, employeeID, lt.ID, startDate.Year())
		if bErr != nil {
			return nil, apperrors.Internal()
		}
		if bal.RemainingDays < totalDays {
			return nil, apperrors.Conflict("Insufficient remaining leave balance for this request.")
		}
		reserveBalanceID = &bal.ID
	}

	now := time.Now().UTC()
	lr := &models.LeaveRequest{
		OrganizationID: orgID,
		EmployeeID:     employeeID,
		LeaveTypeID:    lt.ID,
		StartDate:      startDate,
		EndDate:        endDate,
		IsHalfDay:      req.IsHalfDay,
		RequestedDays:  totalDays,
		Reason:         strings.TrimSpace(req.Reason),
		RequestStatus:  "PENDING",
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := s.repo.CreateRequestWithReserve(ctx, lr, reserveBalanceID); err != nil {
		return nil, apperrors.Internal()
	}
	created, err := s.repo.FindRequestByID(ctx, orgID, lr.ID)
	if err != nil {
		res := toReqResp(*lr)
		res.LeaveTypeName = lt.Name
		res.LeaveTypeCode = lt.Code
		return &res, nil
	}
	res := toReqResp(*created)
	return &res, nil
}

func (s *svc) ReviewRequest(ctx context.Context, orgID, id, actorAccountID string, req request.ReviewLeaveRequest) (*response.LeaveRequestResponse, *apperrors.Error) {
	decision := strings.ToUpper(strings.TrimSpace(req.Decision))
	if decision != "APPROVED" && decision != "REJECTED" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "decision", Message: "decision must be APPROVED or REJECTED."}})
	}

	lr, err := s.repo.FindRequestByID(ctx, orgID, id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Leave request not found.")
		}
		return nil, apperrors.Internal()
	}
	if lr.RequestStatus != "PENDING" {
		return nil, apperrors.Conflict("Only PENDING leave requests can be reviewed.")
	}

	lt, err := s.repo.FindLeaveTypeByID(ctx, orgID, lr.LeaveTypeID)
	requiresBalance := err == nil && lt != nil && lt.RequiresBalance

	var actorPtr *string
	if actorAccountID != "" {
		actorPtr = &actorAccountID
	}
	lr.RequestStatus = decision
	approval := &models.LeaveApproval{
		OrganizationID:    orgID,
		LeaveRequestID:    lr.ID,
		ApproverAccountID: actorPtr,
		Decision:          decision,
		Remarks:           req.Remarks,
		DecidedAt:         time.Now().UTC(),
	}
	if err := s.repo.ReviewRequestTx(ctx, orgID, lr, approval, lr.StartDate.Year(), requiresBalance); err != nil {
		return nil, apperrors.Internal()
	}
	res := toReqResp(*lr)
	res.DecisionNotes = req.Remarks
	return &res, nil
}

func (s *svc) CancelOwnRequest(ctx context.Context, orgID, id, employeeID string) (*response.LeaveRequestResponse, *apperrors.Error) {
	lr, err := s.repo.FindRequestByID(ctx, orgID, id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Leave request not found.")
		}
		return nil, apperrors.Internal()
	}
	if lr.EmployeeID != employeeID {
		return nil, apperrors.Forbidden("You can only cancel your own leave requests.")
	}
	if lr.RequestStatus != "PENDING" {
		return nil, apperrors.Conflict("Only PENDING leave requests can be cancelled.")
	}
	lt, err := s.repo.FindLeaveTypeByID(ctx, orgID, lr.LeaveTypeID)
	requiresBalance := err == nil && lt != nil && lt.RequiresBalance

	if err := s.repo.CancelRequestTx(ctx, orgID, lr, lr.StartDate.Year(), requiresBalance); err != nil {
		return nil, apperrors.Internal()
	}
	lr.RequestStatus = "CANCELLED"
	res := toReqResp(*lr)
	return &res, nil
}

func toTypeResp(m models.LeaveType) response.LeaveTypeResponse {
	return response.LeaveTypeResponse{
		ID:              m.ID,
		OrganizationID:  m.OrganizationID,
		Code:            m.Code,
		Name:            m.Name,
		Description:     m.Description,
		IsPaid:          m.IsPaid,
		RequiresBalance: m.RequiresBalance,
		AnnualAllowance: m.AnnualAllowance,
		Status:          m.Status,
		CreatedAt:       m.CreatedAt,
	}
}

func toBalanceResp(m models.LeaveBalance) response.LeaveBalanceResponse {
	return response.LeaveBalanceResponse{
		ID:              m.ID,
		OrganizationID:  m.OrganizationID,
		EmployeeID:      m.EmployeeID,
		EmployeeCode:    m.EmployeeCode,
		EmployeeName:    m.EmployeeName,
		LeaveTypeID:     m.LeaveTypeID,
		LeaveTypeCode:   m.LeaveTypeCode,
		LeaveTypeName:   m.LeaveTypeName,
		RequiresBalance: m.RequiresBalance,
		BalanceYear:     m.BalanceYear,
		AllocatedDays:   m.AllocatedDays,
		UsedDays:        m.UsedDays,
		PendingDays:     m.PendingDays,
		RemainingDays:   m.RemainingDays,
	}
}

func toReqResp(m models.LeaveRequest) response.LeaveRequestResponse {
	return response.LeaveRequestResponse{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		EmployeeID:     m.EmployeeID,
		EmployeeCode:   m.EmployeeCode,
		EmployeeName:   m.EmployeeName,
		LeaveTypeID:    m.LeaveTypeID,
		LeaveTypeCode:  m.LeaveTypeCode,
		LeaveTypeName:  m.LeaveTypeName,
		StartDate:      m.StartDate.Format("2006-01-02"),
		EndDate:        m.EndDate.Format("2006-01-02"),
		IsHalfDay:      m.IsHalfDay,
		RequestedDays:  m.RequestedDays,
		Reason:         m.Reason,
		RequestStatus:  m.RequestStatus,
		DecisionNotes:  m.DecisionNotes,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}
