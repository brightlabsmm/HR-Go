package service

import (
	"context"
	"math"
	"regexp"
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/shift/mapper"
	"hrgo/backend/internal/modules/workspace/shift/models"
	"hrgo/backend/internal/modules/workspace/shift/repository"
	"hrgo/backend/internal/modules/workspace/shift/request"
	"hrgo/backend/internal/modules/workspace/shift/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

var timeRegex = regexp.MustCompile(`^(?:[01]\d|2[0-3]):[0-5]\d$`)

type Service interface {
	CreateShift(ctx context.Context, orgID string, req request.CreateShiftRequest) (*response.ShiftResponse, *apperrors.Error)
	GetShiftByID(ctx context.Context, orgID, id string) (*response.ShiftResponse, *apperrors.Error)
	ListShifts(ctx context.Context, orgID string, q request.ListShiftsQuery) (*response.ShiftListResponse, *apperrors.Error)
	UpdateShift(ctx context.Context, orgID, id string, req request.UpdateShiftRequest) (*response.ShiftResponse, *apperrors.Error)
	DeleteShift(ctx context.Context, orgID, id string) *apperrors.Error

	AssignShift(ctx context.Context, orgID, accountID string, req request.AssignShiftRequest) (*response.AssignmentResponse, *apperrors.Error)
	GetAssignmentByID(ctx context.Context, orgID, id string) (*response.AssignmentResponse, *apperrors.Error)
	ListAssignments(ctx context.Context, orgID string, q request.ListAssignmentsQuery) (*response.AssignmentListResponse, *apperrors.Error)
	ListEmployeeAssignments(ctx context.Context, orgID, employeeID string) ([]response.AssignmentResponse, *apperrors.Error)
	ListAssignmentHistory(ctx context.Context, orgID, employeeID string) ([]response.AssignmentHistoryResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) CreateShift(ctx context.Context, orgID string, req request.CreateShiftRequest) (*response.ShiftResponse, *apperrors.Error) {
	name := strings.TrimSpace(req.ShiftName)
	startTime := strings.TrimSpace(req.StartTime)
	endTime := strings.TrimSpace(req.EndTime)

	var validationIssues []apperrors.FieldIssue

	if name == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "shiftName", Message: "Shift name is required."})
	} else if len(name) > 100 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "shiftName", Message: "Shift name must not exceed 100 characters."})
	}

	if startTime == "" || !timeRegex.MatchString(startTime) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "startTime", Message: "Start time must be in HH:MM format (e.g. 09:00)."})
	}

	if endTime == "" || !timeRegex.MatchString(endTime) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endTime", Message: "End time must be in HH:MM format (e.g. 18:00)."})
	}

	breakMinutes := 60
	if req.BreakMinutes != nil {
		if *req.BreakMinutes < 0 || *req.BreakMinutes > 480 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "breakMinutes", Message: "Break minutes must be between 0 and 480."})
		} else {
			breakMinutes = *req.BreakMinutes
		}
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	isDefault := false
	if req.IsDefault != nil && *req.IsDefault {
		isDefault = true
		_ = s.repo.UnsetDefaultShift(ctx, orgID)
	}

	shift := models.Shift{
		OrganizationID: orgID,
		BranchID:       req.BranchID,
		ShiftName:      name,
		StartTime:      startTime,
		EndTime:        endTime,
		BreakMinutes:   breakMinutes,
		Status:         "ACTIVE",
		IsDefault:      isDefault,
	}

	if err := s.repo.CreateShift(ctx, &shift); err != nil {
		return nil, apperrors.Internal()
	}

	created, err := s.repo.FindShiftByID(ctx, orgID, shift.ID)
	if err != nil || created == nil {
		res := mapper.ToShiftResponse(&shift)
		return &res, nil
	}

	res := mapper.ToShiftResponse(created)
	return &res, nil
}

func (s *service) GetShiftByID(ctx context.Context, orgID, id string) (*response.ShiftResponse, *apperrors.Error) {
	shift, err := s.repo.FindShiftByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if shift == nil {
		return nil, apperrors.NotFound("Shift not found.")
	}

	res := mapper.ToShiftResponse(shift)
	return &res, nil
}

func (s *service) ListShifts(ctx context.Context, orgID string, q request.ListShiftsQuery) (*response.ShiftListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListShifts(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.ShiftListResponse{
		Items: mapper.ToShiftResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) UpdateShift(ctx context.Context, orgID, id string, req request.UpdateShiftRequest) (*response.ShiftResponse, *apperrors.Error) {
	shift, err := s.repo.FindShiftByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if shift == nil {
		return nil, apperrors.NotFound("Shift not found.")
	}

	var validationIssues []apperrors.FieldIssue

	if req.ShiftName != nil {
		name := strings.TrimSpace(*req.ShiftName)
		if name == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "shiftName", Message: "Shift name cannot be empty."})
		} else if len(name) > 100 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "shiftName", Message: "Shift name must not exceed 100 characters."})
		} else {
			shift.ShiftName = name
		}
	}

	if req.StartTime != nil {
		st := strings.TrimSpace(*req.StartTime)
		if !timeRegex.MatchString(st) {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "startTime", Message: "Start time must be in HH:MM format."})
		} else {
			shift.StartTime = st
		}
	}

	if req.EndTime != nil {
		et := strings.TrimSpace(*req.EndTime)
		if !timeRegex.MatchString(et) {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endTime", Message: "End time must be in HH:MM format."})
		} else {
			shift.EndTime = et
		}
	}

	if req.BreakMinutes != nil {
		if *req.BreakMinutes < 0 || *req.BreakMinutes > 480 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "breakMinutes", Message: "Break minutes must be between 0 and 480."})
		} else {
			shift.BreakMinutes = *req.BreakMinutes
		}
	}

	if req.BranchID != nil {
		shift.BranchID = req.BranchID
	}

	if req.Status != nil && *req.Status != "" {
		shift.Status = strings.ToUpper(strings.TrimSpace(*req.Status))
	}

	if req.IsDefault != nil && *req.IsDefault {
		_ = s.repo.UnsetDefaultShift(ctx, orgID)
		shift.IsDefault = true
	} else if req.IsDefault != nil && !*req.IsDefault {
		shift.IsDefault = false
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	if err := s.repo.UpdateShift(ctx, shift); err != nil {
		return nil, apperrors.Internal()
	}

	updated, err := s.repo.FindShiftByID(ctx, orgID, id)
	if err != nil || updated == nil {
		res := mapper.ToShiftResponse(shift)
		return &res, nil
	}

	res := mapper.ToShiftResponse(updated)
	return &res, nil
}

func (s *service) DeleteShift(ctx context.Context, orgID, id string) *apperrors.Error {
	shift, err := s.repo.FindShiftByID(ctx, orgID, id)
	if err != nil {
		return apperrors.Internal()
	}
	if shift == nil {
		return apperrors.NotFound("Shift not found.")
	}

	if shift.IsDefault {
		return apperrors.BadRequest("Cannot delete default shift.")
	}

	if err := s.repo.SoftDeleteShift(ctx, orgID, id); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) AssignShift(ctx context.Context, orgID, accountID string, req request.AssignShiftRequest) (*response.AssignmentResponse, *apperrors.Error) {
	shift, err := s.repo.FindShiftByID(ctx, orgID, req.ShiftID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if shift == nil {
		return nil, apperrors.NotFound("Shift not found.")
	}

	effFrom, err := mapper.ParseDate(req.EffectiveFrom)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "effectiveFrom", Message: "Invalid effective from date format, expected YYYY-MM-DD."},
		})
	}

	var effTo *time.Time
	if req.EffectiveTo != nil && strings.TrimSpace(*req.EffectiveTo) != "" {
		d, err := mapper.ParseDate(*req.EffectiveTo)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "effectiveTo", Message: "Invalid effective to date format, expected YYYY-MM-DD."},
			})
		}
		if d.Before(*effFrom) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "effectiveTo", Message: "Effective to date cannot be before effective from date."},
			})
		}
		effTo = d
	}

	// Check previous assignment to record history
	currentAssignment, _ := s.repo.FindCurrentAssignmentByEmployee(ctx, orgID, req.EmployeeID, *effFrom)

	assignment := models.EmployeeShiftAssignment{
		OrganizationID: orgID,
		EmployeeID:     req.EmployeeID,
		ShiftID:        req.ShiftID,
		EffectiveFrom:  *effFrom,
		EffectiveTo:    effTo,
		Status:         "ACTIVE",
	}

	var accountIDPtr *string
	if accountID != "" {
		accountIDPtr = &accountID
	}

	var history models.EmployeeShiftAssignmentHistory
	history.OrganizationID = orgID
	history.EmployeeID = req.EmployeeID
	history.NewShiftID = &req.ShiftID
	history.NewEffectiveFrom = effFrom
	history.NewEffectiveTo = effTo
	history.ChangedByAccountID = accountIDPtr
	history.ChangedAt = time.Now().UTC()
	history.Reason = req.Reason

	if currentAssignment != nil {
		history.OldShiftID = &currentAssignment.ShiftID
		history.OldEffectiveFrom = &currentAssignment.EffectiveFrom
		history.OldEffectiveTo = currentAssignment.EffectiveTo
	}

	if err := s.repo.CreateAssignment(ctx, &assignment, &history); err != nil {
		return nil, apperrors.Internal()
	}

	created, err := s.repo.FindAssignmentByID(ctx, orgID, assignment.ID)
	if err != nil || created == nil {
		res := mapper.ToAssignmentResponse(&assignment)
		return &res, nil
	}

	res := mapper.ToAssignmentResponse(created)
	return &res, nil
}

func (s *service) GetAssignmentByID(ctx context.Context, orgID, id string) (*response.AssignmentResponse, *apperrors.Error) {
	a, err := s.repo.FindAssignmentByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if a == nil {
		return nil, apperrors.NotFound("Shift assignment not found.")
	}

	res := mapper.ToAssignmentResponse(a)
	return &res, nil
}

func (s *service) ListAssignments(ctx context.Context, orgID string, q request.ListAssignmentsQuery) (*response.AssignmentListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListAssignments(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.AssignmentListResponse{
		Items: mapper.ToAssignmentResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) ListEmployeeAssignments(ctx context.Context, orgID, employeeID string) ([]response.AssignmentResponse, *apperrors.Error) {
	items, err := s.repo.ListEmployeeAssignments(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	return mapper.ToAssignmentResponses(items), nil
}

func (s *service) ListAssignmentHistory(ctx context.Context, orgID, employeeID string) ([]response.AssignmentHistoryResponse, *apperrors.Error) {
	items, err := s.repo.ListAssignmentHistory(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	return mapper.ToAssignmentHistoryResponses(items), nil
}
