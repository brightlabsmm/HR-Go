package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/workspace/department/mapper"
	"hrgo/backend/internal/modules/workspace/department/models"
	"hrgo/backend/internal/modules/workspace/department/repository"
	"hrgo/backend/internal/modules/workspace/department/request"
	"hrgo/backend/internal/modules/workspace/department/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, orgID string, req request.CreateDepartmentRequest) (*response.DepartmentResponse, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.DepartmentResponse, *apperrors.Error)
	List(ctx context.Context, orgID string, q request.ListDepartmentsQuery) ([]response.DepartmentResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdateDepartmentRequest) (*response.DepartmentResponse, *apperrors.Error)
	Deactivate(ctx context.Context, orgID, id string) (*response.DepartmentResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreateDepartmentRequest) (*response.DepartmentResponse, *apperrors.Error) {
	name := strings.TrimSpace(req.DepartmentName)
	if name == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "departmentName", Message: "Department name is required."},
		})
	}
	if len(name) > 150 {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "departmentName", Message: "Department name cannot exceed 150 characters."},
		})
	}

	var branchID *string
	if req.BranchID != nil && strings.TrimSpace(*req.BranchID) != "" {
		bid := strings.TrimSpace(*req.BranchID)
		exists, err := s.repo.BranchExists(ctx, orgID, bid)
		if err != nil {
			return nil, apperrors.Internal()
		}
		if !exists {
			return nil, apperrors.BadRequest("Branch not found in this organization.")
		}
		branchID = &bid
	}

	dept := &models.Department{
		OrganizationID: orgID,
		BranchID:       branchID,
		Name:           strings.TrimSpace(req.DepartmentName),
		Status:         "ACTIVE",
	}

	if err := s.repo.Create(ctx, dept); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToDepartmentResponse(dept)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.DepartmentResponse, *apperrors.Error) {
	dept, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if dept == nil {
		return nil, apperrors.NotFound("Department not found")
	}
	res := mapper.ToDepartmentResponse(dept)
	return &res, nil
}

func (s *service) List(ctx context.Context, orgID string, q request.ListDepartmentsQuery) ([]response.DepartmentResponse, int, int, int64, *apperrors.Error) {
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
	return mapper.ToDepartmentList(items), page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdateDepartmentRequest) (*response.DepartmentResponse, *apperrors.Error) {
	dept, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if dept == nil {
		return nil, apperrors.NotFound("Department not found")
	}

	if req.BranchID != nil {
		if *req.BranchID != "" {
			exists, err := s.repo.BranchExists(ctx, orgID, *req.BranchID)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if !exists {
				return nil, apperrors.BadRequest("Branch not found in this organization.")
			}
			dept.BranchID = req.BranchID
		} else {
			dept.BranchID = nil
		}
	}

	if req.DepartmentName != nil {
		name := strings.TrimSpace(*req.DepartmentName)
		if name == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "departmentName", Message: "Department name is required."},
			})
		}
		if len(name) > 150 {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "departmentName", Message: "Department name cannot exceed 150 characters."},
			})
		}
		dept.Name = name
	}

	if err := s.repo.Update(ctx, dept); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToDepartmentResponse(dept)
	return &res, nil
}

func (s *service) Deactivate(ctx context.Context, orgID, id string) (*response.DepartmentResponse, *apperrors.Error) {
	dept, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if dept == nil {
		return nil, apperrors.NotFound("Department not found")
	}

	dept.Status = "INACTIVE"
	if err := s.repo.Update(ctx, dept); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToDepartmentResponse(dept)
	return &res, nil
}
