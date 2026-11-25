package service

import (
	"context"
	"math"
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/holiday/mapper"
	"hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/holiday/repository"
	"hrgo/backend/internal/modules/workspace/holiday/request"
	"hrgo/backend/internal/modules/workspace/holiday/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, orgID string, req request.CreateHolidayRequest) (*response.HolidayResponse, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.HolidayResponse, *apperrors.Error)
	List(ctx context.Context, orgID string, q request.ListHolidaysQuery) (*response.HolidayListResponse, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdateHolidayRequest) (*response.HolidayResponse, *apperrors.Error)
	Delete(ctx context.Context, orgID, id string) *apperrors.Error
	GetCalendar(ctx context.Context, orgID string, q request.HolidayCalendarQuery) (*response.CalendarResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreateHolidayRequest) (*response.HolidayResponse, *apperrors.Error) {
	name := strings.TrimSpace(req.HolidayName)

	var validationIssues []apperrors.FieldIssue

	if name == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "holidayName", Message: "Holiday name is required."})
	} else if len(name) > 150 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "holidayName", Message: "Holiday name must not exceed 150 characters."})
	}

	startDate, err := mapper.ParseDate(req.StartDate)
	if err != nil {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "startDate", Message: "Invalid start date format, expected YYYY-MM-DD."})
	}

	endDate, err := mapper.ParseDate(req.EndDate)
	if err != nil {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endDate", Message: "Invalid end date format, expected YYYY-MM-DD."})
	}

	if startDate != nil && endDate != nil && endDate.Before(*startDate) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endDate", Message: "End date cannot be before start date."})
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	holidayType := "PUBLIC"
	if req.HolidayType != nil && *req.HolidayType != "" {
		holidayType = strings.ToUpper(strings.TrimSpace(*req.HolidayType))
	}

	isPaid := true
	if req.IsPaid != nil {
		isPaid = *req.IsPaid
	}

	h := models.Holiday{
		OrganizationID: orgID,
		BranchID:       req.BranchID,
		HolidayName:    name,
		StartDate:      *startDate,
		EndDate:        *endDate,
		HolidayType:    holidayType,
		IsPaid:         isPaid,
	}

	if err := s.repo.Create(ctx, &h); err != nil {
		return nil, apperrors.Internal()
	}

	created, err := s.repo.FindByID(ctx, orgID, h.ID)
	if err != nil || created == nil {
		res := mapper.ToHolidayResponse(&h)
		return &res, nil
	}

	res := mapper.ToHolidayResponse(created)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.HolidayResponse, *apperrors.Error) {
	h, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if h == nil {
		return nil, apperrors.NotFound("Holiday not found.")
	}

	res := mapper.ToHolidayResponse(h)
	return &res, nil
}

func (s *service) List(ctx context.Context, orgID string, q request.ListHolidaysQuery) (*response.HolidayListResponse, *apperrors.Error) {
	items, total, err := s.repo.List(ctx, orgID, q)
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

	return &response.HolidayListResponse{
		Items: mapper.ToHolidayResponses(items),
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

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdateHolidayRequest) (*response.HolidayResponse, *apperrors.Error) {
	h, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if h == nil {
		return nil, apperrors.NotFound("Holiday not found.")
	}

	var validationIssues []apperrors.FieldIssue

	if req.HolidayName != nil {
		name := strings.TrimSpace(*req.HolidayName)
		if name == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "holidayName", Message: "Holiday name cannot be empty."})
		} else if len(name) > 150 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "holidayName", Message: "Holiday name must not exceed 150 characters."})
		} else {
			h.HolidayName = name
		}
	}

	var startDate = h.StartDate
	if req.StartDate != nil {
		d, err := mapper.ParseDate(*req.StartDate)
		if err != nil {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "startDate", Message: "Invalid start date format, expected YYYY-MM-DD."})
		} else {
			startDate = *d
			h.StartDate = *d
		}
	}

	var endDate = h.EndDate
	if req.EndDate != nil {
		d, err := mapper.ParseDate(*req.EndDate)
		if err != nil {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endDate", Message: "Invalid end date format, expected YYYY-MM-DD."})
		} else {
			endDate = *d
			h.EndDate = *d
		}
	}

	if endDate.Before(startDate) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "endDate", Message: "End date cannot be before start date."})
	}

	if req.BranchID != nil {
		h.BranchID = req.BranchID
	}
	if req.HolidayType != nil && *req.HolidayType != "" {
		h.HolidayType = strings.ToUpper(strings.TrimSpace(*req.HolidayType))
	}
	if req.IsPaid != nil {
		h.IsPaid = *req.IsPaid
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	if err := s.repo.Update(ctx, h); err != nil {
		return nil, apperrors.Internal()
	}

	updated, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil || updated == nil {
		res := mapper.ToHolidayResponse(h)
		return &res, nil
	}

	res := mapper.ToHolidayResponse(updated)
	return &res, nil
}

func (s *service) Delete(ctx context.Context, orgID, id string) *apperrors.Error {
	h, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return apperrors.Internal()
	}
	if h == nil {
		return apperrors.NotFound("Holiday not found.")
	}

	if err := s.repo.SoftDelete(ctx, orgID, id); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) GetCalendar(ctx context.Context, orgID string, q request.HolidayCalendarQuery) (*response.CalendarResponse, *apperrors.Error) {
	if q.Year < 1900 || q.Year > 2200 {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "year", Message: "Year must be between 1900 and 2200."},
		})
	}

	var from, to time.Time
	var monthPtr *int
	if q.Month >= 1 && q.Month <= 12 {
		monthPtr = &q.Month
		from = time.Date(q.Year, time.Month(q.Month), 1, 0, 0, 0, 0, time.UTC)
		// next month day 1 minus 1 day
		to = from.AddDate(0, 1, -1)
	} else {
		from = time.Date(q.Year, 1, 1, 0, 0, 0, 0, time.UTC)
		to = time.Date(q.Year, 12, 31, 23, 59, 59, 0, time.UTC)
	}

	items, err := s.repo.GetCalendarHolidays(ctx, orgID, q.BranchID, from, to)
	if err != nil {
		return nil, apperrors.Internal()
	}

	var branchPtr *string
	if q.BranchID != "" {
		branchPtr = &q.BranchID
	}

	return &response.CalendarResponse{
		Year:     q.Year,
		Month:    monthPtr,
		BranchID: branchPtr,
		Holidays: mapper.ToCalendarHolidayItems(items),
	}, nil
}
