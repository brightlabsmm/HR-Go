package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/workspace/position/mapper"
	"hrgo/backend/internal/modules/workspace/position/models"
	"hrgo/backend/internal/modules/workspace/position/repository"
	"hrgo/backend/internal/modules/workspace/position/request"
	"hrgo/backend/internal/modules/workspace/position/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, orgID string, req request.CreatePositionRequest) (*response.PositionResponse, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.PositionResponse, *apperrors.Error)
	List(ctx context.Context, orgID string, q request.ListPositionsQuery) ([]response.PositionResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdatePositionRequest) (*response.PositionResponse, *apperrors.Error)
	Deactivate(ctx context.Context, orgID, id string) (*response.PositionResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreatePositionRequest) (*response.PositionResponse, *apperrors.Error) {
	code := strings.TrimSpace(req.PositionCode)
	existing, err := s.repo.FindByCode(ctx, orgID, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existing != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "positionCode", Message: "Position code already exists in this organization."},
		})
	}

	if req.DepartmentID != nil && *req.DepartmentID != "" {
		exists, err := s.repo.DepartmentExists(ctx, orgID, *req.DepartmentID)
		if err != nil {
			return nil, apperrors.Internal()
		}
		if !exists {
			return nil, apperrors.BadRequest("Department not found in this organization.")
		}
	}

	pos := &models.Position{
		OrganizationID: orgID,
		DepartmentID:   req.DepartmentID,
		Code:           code,
		Name:           req.PositionName,
		Status:         "ACTIVE",
	}

	if err := s.repo.Create(ctx, pos); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToPositionResponse(pos)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.PositionResponse, *apperrors.Error) {
	pos, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if pos == nil {
		return nil, apperrors.NotFound("Position not found")
	}
	res := mapper.ToPositionResponse(pos)
	return &res, nil
}

func (s *service) List(ctx context.Context, orgID string, q request.ListPositionsQuery) ([]response.PositionResponse, int, int, int64, *apperrors.Error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.repo.List(ctx, orgID, q)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}
	return mapper.ToPositionList(items), page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdatePositionRequest) (*response.PositionResponse, *apperrors.Error) {
	pos, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if pos == nil {
		return nil, apperrors.NotFound("Position not found")
	}

	if req.DepartmentID != nil {
		if *req.DepartmentID != "" {
			exists, err := s.repo.DepartmentExists(ctx, orgID, *req.DepartmentID)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if !exists {
				return nil, apperrors.BadRequest("Department not found in this organization.")
			}
			pos.DepartmentID = req.DepartmentID
		} else {
			pos.DepartmentID = nil
		}
	}

	if req.PositionName != nil {
		pos.Name = *req.PositionName
	}

	if err := s.repo.Update(ctx, pos); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToPositionResponse(pos)
	return &res, nil
}

func (s *service) Deactivate(ctx context.Context, orgID, id string) (*response.PositionResponse, *apperrors.Error) {
	pos, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if pos == nil {
		return nil, apperrors.NotFound("Position not found")
	}

	pos.Status = "INACTIVE"
	if err := s.repo.Update(ctx, pos); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToPositionResponse(pos)
	return &res, nil
}
