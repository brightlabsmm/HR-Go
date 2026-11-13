package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/control/organization/mapper"
	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/repository"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, req request.CreateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	GetByID(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error)
	List(ctx context.Context, query request.ListOrganizationsQuery) ([]response.OrganizationResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, id string, req request.UpdateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	UpdateStatus(ctx context.Context, id string, req request.UpdateStatusRequest) (*response.OrganizationResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req request.CreateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error) {
	code := strings.TrimSpace(req.OrganizationCode)
	existing, err := s.repo.FindByCode(ctx, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existing != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "organizationCode", Message: "This organization code is already in use."},
		})
	}

	country := req.Country
	if country == "" {
		country = "MM"
	}

	org := &models.Organization{
		Code:         code,
		LegalName:    req.LegalName,
		DisplayName:  req.DisplayName,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
		Country:      country,
		Address:      req.Address,
		Status:       "PENDING",
	}

	if err := s.repo.Create(ctx, org); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}
	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) List(ctx context.Context, query request.ListOrganizationsQuery) ([]response.OrganizationResponse, int, int, int64, *apperrors.Error) {
	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}

	res := mapper.ToOrganizationList(items)
	return res, page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, id string, req request.UpdateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	if req.LegalName != nil {
		org.LegalName = *req.LegalName
	}
	if req.DisplayName != nil {
		org.DisplayName = *req.DisplayName
	}
	if req.ContactEmail != nil {
		org.ContactEmail = *req.ContactEmail
	}
	if req.ContactPhone != nil {
		org.ContactPhone = *req.ContactPhone
	}
	if req.Country != nil {
		org.Country = *req.Country
	}
	if req.Address != nil {
		org.Address = *req.Address
	}

	if err := s.repo.Update(ctx, org); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) UpdateStatus(ctx context.Context, id string, req request.UpdateStatusRequest) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	target := strings.ToUpper(req.Status)
	allowed := map[string]bool{"PENDING": true, "ACTIVE": true, "SUSPENDED": true, "ARCHIVED": true}
	if !allowed[target] {
		return nil, apperrors.Conflict("Invalid organization status transition to " + target)
	}

	if (target == "SUSPENDED" || target == "ARCHIVED") && !req.Confirmation {
		return nil, apperrors.BadRequest("Confirmation is required for high-impact status changes.")
	}

	org.Status = target
	if err := s.repo.Update(ctx, org); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}
