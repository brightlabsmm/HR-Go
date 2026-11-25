package service

import (
	"context"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/overtime/models"
	"hrgo/backend/internal/modules/workspace/overtime/repository"
	"hrgo/backend/internal/modules/workspace/overtime/request"
	"hrgo/backend/internal/modules/workspace/overtime/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

var hhmmRegex = regexp.MustCompile(`^([01]\d|2[0-3]):([0-5]\d)$`)

type Service interface {
	ListCategories(ctx context.Context, orgID string, activeOnly bool) ([]response.OvertimeCategoryResponse, *apperrors.Error)
	CreateCategory(ctx context.Context, orgID string, req request.CreateOvertimeCategoryRequest) (*response.OvertimeCategoryResponse, *apperrors.Error)
	ListRequests(ctx context.Context, orgID string, q request.ListOvertimeRequestsQuery) ([]response.OvertimeRequestResponse, int64, *apperrors.Error)
	CreateRequest(ctx context.Context, orgID, actorEmployeeID string, req request.CreateOvertimeRequest) (*response.OvertimeRequestResponse, *apperrors.Error)
	ReviewRequest(ctx context.Context, orgID, id, actorAccountID string, req request.ReviewOvertimeRequest) (*response.OvertimeRequestResponse, *apperrors.Error)
	ListEntries(ctx context.Context, orgID, employeeID string) ([]response.OvertimeEntryResponse, *apperrors.Error)
}

type svc struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &svc{repo: repo}
}

func (s *svc) ListCategories(ctx context.Context, orgID string, activeOnly bool) ([]response.OvertimeCategoryResponse, *apperrors.Error) {
	rows, err := s.repo.ListCategories(ctx, orgID, activeOnly)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.OvertimeCategoryResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toCategoryResp(r))
	}
	return out, nil
}

func (s *svc) CreateCategory(ctx context.Context, orgID string, req request.CreateOvertimeCategoryRequest) (*response.OvertimeCategoryResponse, *apperrors.Error) {
	if req.MinMinutes > req.MaxDailyMinutes {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "minMinutes", Message: "minMinutes cannot exceed maxDailyMinutes."}})
	}
	preApp := true
	if req.RequiresPreApproval != nil {
		preApp = *req.RequiresPreApproval
	}

	now := time.Now().UTC()
	cat := &models.OvertimeCategory{
		OrganizationID: orgID,
		Code:           strings.ToUpper(strings.TrimSpace(req.Code)),
		Name:           strings.TrimSpace(req.Name),
		Description:    req.Description,
		RateMultiplier: req.RateMultiplier,
		Status:         "ACTIVE",
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	rule := &models.OvertimeRule{
		MinMinutes:          req.MinMinutes,
		MaxDailyMinutes:     req.MaxDailyMinutes,
		RequiresPreApproval: preApp,
		CreatedAt:           now,
		UpdatedAt:           now,
	}
	if err := s.repo.CreateCategoryWithRule(ctx, cat, rule); err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, apperrors.Conflict("An overtime category with this code already exists.")
		}
		return nil, apperrors.Internal()
	}
	res := toCategoryResp(repository.CategoryWithRule{
		OvertimeCategory:    *cat,
		MinMinutes:          rule.MinMinutes,
		MaxDailyMinutes:     rule.MaxDailyMinutes,
		RequiresPreApproval: rule.RequiresPreApproval,
	})
	return &res, nil
}

func (s *svc) ListRequests(ctx context.Context, orgID string, q request.ListOvertimeRequestsQuery) ([]response.OvertimeRequestResponse, int64, *apperrors.Error) {
	rows, total, err := s.repo.ListRequests(ctx, orgID, q)
	if err != nil {
		return nil, 0, apperrors.Internal()
	}
	out := make([]response.OvertimeRequestResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, toReqResp(r))
	}
	return out, total, nil
}

func (s *svc) CreateRequest(ctx context.Context, orgID, actorEmployeeID string, req request.CreateOvertimeRequest) (*response.OvertimeRequestResponse, *apperrors.Error) {
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

	cat, err := s.repo.FindCategoryByID(ctx, orgID, req.OvertimeCategoryID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Overtime category not found.")
		}
		return nil, apperrors.Internal()
	}

	workDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.WorkDate))
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "workDate", Message: "workDate must be YYYY-MM-DD."}})
	}

	startMins, okStart := parseClockMinutes(req.StartTime)
	endMins, okEnd := parseClockMinutes(req.EndTime)
	if !okStart || !okEnd {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "startTime", Message: "startTime and endTime must use HH:MM format."}})
	}
	duration := endMins - startMins
	if duration <= 0 {
		// Support overnight overtime shifts crossing midnight.
		duration += 24 * 60
	}
	if duration < cat.MinMinutes {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endTime", Message: "Overtime duration is below the category minimum."}})
	}
	if cat.MaxDailyMinutes > 0 && duration > cat.MaxDailyMinutes {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "endTime", Message: "Overtime duration exceeds the daily category maximum."}})
	}

	now := time.Now().UTC()
	ot := &models.OvertimeRequest{
		OrganizationID:     orgID,
		EmployeeID:         employeeID,
		OvertimeCategoryID: cat.ID,
		WorkDate:           workDate,
		StartTime:          strings.TrimSpace(req.StartTime),
		EndTime:            strings.TrimSpace(req.EndTime),
		RequestedMinutes:   duration,
		Reason:             strings.TrimSpace(req.Reason),
		RequestStatus:      "PENDING",
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	if err := s.repo.CreateRequest(ctx, ot); err != nil {
		return nil, apperrors.Internal()
	}

	created, findErr := s.repo.FindRequestByID(ctx, orgID, ot.ID)
	if findErr != nil {
		res := toReqResp(*ot)
		res.CategoryCode = cat.Code
		res.CategoryName = cat.Name
		res.Multiplier = cat.RateMultiplier
		return &res, nil
	}
	res := toReqResp(*created)
	return &res, nil
}

func (s *svc) ReviewRequest(ctx context.Context, orgID, id, actorAccountID string, req request.ReviewOvertimeRequest) (*response.OvertimeRequestResponse, *apperrors.Error) {
	decision := strings.ToUpper(strings.TrimSpace(req.Decision))
	if decision != "APPROVED" && decision != "REJECTED" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "decision", Message: "decision must be APPROVED or REJECTED."}})
	}

	ot, err := s.repo.FindRequestByID(ctx, orgID, id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("Overtime request not found.")
		}
		return nil, apperrors.Internal()
	}
	if ot.RequestStatus != "PENDING" {
		return nil, apperrors.Conflict("Only PENDING overtime requests can be reviewed.")
	}

	var actorPtr *string
	if actorAccountID != "" {
		actorPtr = &actorAccountID
	}
	now := time.Now().UTC()
	ot.RequestStatus = decision
	approval := &models.OvertimeApproval{
		OrganizationID:    orgID,
		OvertimeRequestID: ot.ID,
		ApproverAccountID: actorPtr,
		Decision:          decision,
		Remarks:           req.Remarks,
		DecidedAt:         now,
	}

	var entry *models.OvertimeEntry
	if decision == "APPROVED" {
		mult := ot.Multiplier
		if mult <= 0 {
			mult = 1.5
		}
		entry = &models.OvertimeEntry{
			OrganizationID:     orgID,
			OvertimeRequestID:  ot.ID,
			EmployeeID:         ot.EmployeeID,
			OvertimeCategoryID: ot.OvertimeCategoryID,
			WorkDate:           ot.WorkDate,
			ApprovedMinutes:    ot.RequestedMinutes,
			Multiplier:         mult,
			CreatedAt:          now,
		}
	}

	if err := s.repo.ReviewRequestTx(ctx, orgID, ot, approval, entry); err != nil {
		return nil, apperrors.Internal()
	}
	res := toReqResp(*ot)
	res.DecisionNotes = req.Remarks
	return &res, nil
}

func (s *svc) ListEntries(ctx context.Context, orgID, employeeID string) ([]response.OvertimeEntryResponse, *apperrors.Error) {
	rows, err := s.repo.ListEntries(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	out := make([]response.OvertimeEntryResponse, 0, len(rows))
	for _, r := range rows {
		out = append(out, response.OvertimeEntryResponse{
			ID:                 r.ID,
			OvertimeRequestID:  r.OvertimeRequestID,
			EmployeeID:         r.EmployeeID,
			OvertimeCategoryID: r.OvertimeCategoryID,
			WorkDate:           r.WorkDate.Format("2006-01-02"),
			ApprovedMinutes:    r.ApprovedMinutes,
			Multiplier:         r.Multiplier,
			CreatedAt:          r.CreatedAt,
		})
	}
	return out, nil
}

func parseClockMinutes(s string) (int, bool) {
	m := hhmmRegex.FindStringSubmatch(strings.TrimSpace(s))
	if len(m) != 3 {
		return 0, false
	}
	hh, _ := strconv.Atoi(m[1])
	mm, _ := strconv.Atoi(m[2])
	return hh*60 + mm, true
}

func toCategoryResp(m repository.CategoryWithRule) response.OvertimeCategoryResponse {
	return response.OvertimeCategoryResponse{
		ID:                  m.ID,
		OrganizationID:      m.OrganizationID,
		Code:                m.Code,
		Name:                m.Name,
		Description:         m.Description,
		RateMultiplier:      m.RateMultiplier,
		MinMinutes:          m.MinMinutes,
		MaxDailyMinutes:     m.MaxDailyMinutes,
		RequiresPreApproval: m.RequiresPreApproval,
		Status:              m.Status,
		CreatedAt:           m.CreatedAt,
	}
}

func toReqResp(m models.OvertimeRequest) response.OvertimeRequestResponse {
	return response.OvertimeRequestResponse{
		ID:                 m.ID,
		OrganizationID:     m.OrganizationID,
		EmployeeID:         m.EmployeeID,
		EmployeeCode:       m.EmployeeCode,
		EmployeeName:       m.EmployeeName,
		OvertimeCategoryID: m.OvertimeCategoryID,
		CategoryCode:       m.CategoryCode,
		CategoryName:       m.CategoryName,
		Multiplier:         m.Multiplier,
		WorkDate:           m.WorkDate.Format("2006-01-02"),
		StartTime:          m.StartTime,
		EndTime:            m.EndTime,
		RequestedMinutes:   m.RequestedMinutes,
		Reason:             m.Reason,
		RequestStatus:      m.RequestStatus,
		DecisionNotes:      m.DecisionNotes,
		CreatedAt:          m.CreatedAt,
		UpdatedAt:          m.UpdatedAt,
	}
}
