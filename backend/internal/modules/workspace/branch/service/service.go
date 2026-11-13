package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/workspace/branch/mapper"
	"hrgo/backend/internal/modules/workspace/branch/models"
	"hrgo/backend/internal/modules/workspace/branch/repository"
	"hrgo/backend/internal/modules/workspace/branch/request"
	"hrgo/backend/internal/modules/workspace/branch/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, orgID string, req request.CreateBranchRequest) (*response.BranchResponse, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.BranchResponse, *apperrors.Error)
	List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]response.BranchResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdateBranchRequest) (*response.BranchResponse, *apperrors.Error)
	Deactivate(ctx context.Context, orgID, id string) (*response.BranchResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreateBranchRequest) (*response.BranchResponse, *apperrors.Error) {
	code := strings.TrimSpace(req.BranchCode)
	existing, err := s.repo.FindByCode(ctx, orgID, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existing != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "branchCode", Message: "Branch code already exists in this organization."},
		})
	}

	if req.ParentID != nil && *req.ParentID != "" {
		parent, err := s.repo.FindByID(ctx, orgID, *req.ParentID)
		if err != nil {
			return nil, apperrors.Internal()
		}
		if parent == nil {
			return nil, apperrors.BadRequest("Parent branch not found in this organization.")
		}
	}

	branch := &models.Branch{
		OrganizationID: orgID,
		ParentID:       req.ParentID,
		Code:           code,
		Name:           req.BranchName,
		Address:        req.Address,
		Status:         "ACTIVE",
	}

	if err := s.repo.Create(ctx, branch); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToBranchResponse(branch)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.BranchResponse, *apperrors.Error) {
	branch, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if branch == nil {
		return nil, apperrors.NotFound("Branch not found")
	}
	res := mapper.ToBranchResponse(branch)
	return &res, nil
}

func (s *service) List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]response.BranchResponse, int, int, int64, *apperrors.Error) {
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
	return mapper.ToBranchList(items), page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdateBranchRequest) (*response.BranchResponse, *apperrors.Error) {
	branch, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if branch == nil {
		return nil, apperrors.NotFound("Branch not found")
	}

	if req.ParentID != nil {
		if *req.ParentID == id {
			return nil, apperrors.BadRequest("A branch cannot be its own parent.")
		}
		if *req.ParentID != "" {
			parent, err := s.repo.FindByID(ctx, orgID, *req.ParentID)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if parent == nil {
				return nil, apperrors.BadRequest("Parent branch not found in this organization.")
			}
			branch.ParentID = req.ParentID
		} else {
			branch.ParentID = nil
		}
	}

	if req.BranchName != nil {
		branch.Name = *req.BranchName
	}
	if req.Address != nil {
		branch.Address = *req.Address
	}

	if err := s.repo.Update(ctx, branch); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToBranchResponse(branch)
	return &res, nil
}

func (s *service) Deactivate(ctx context.Context, orgID, id string) (*response.BranchResponse, *apperrors.Error) {
	branch, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if branch == nil {
		return nil, apperrors.NotFound("Branch not found")
	}

	branch.Status = "INACTIVE"
	if err := s.repo.Update(ctx, branch); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToBranchResponse(branch)
	return &res, nil
}
