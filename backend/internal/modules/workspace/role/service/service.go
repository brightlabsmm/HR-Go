package service

import (
	"context"

	"hrgo/backend/internal/modules/workspace/role/mapper"
	"hrgo/backend/internal/modules/workspace/role/repository"
	"hrgo/backend/internal/modules/workspace/role/request"
	"hrgo/backend/internal/modules/workspace/role/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	ListRoles(ctx context.Context, orgID string, q request.ListRolesQuery) ([]response.OrgRoleResponse, *apperrors.Error)
	ReplaceAccountRoles(ctx context.Context, orgID, accountID string, req request.ReplaceAccountRolesRequest) *apperrors.Error
	ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]response.PermissionResponse, int, int, int64, *apperrors.Error)
	UpdateRolePermissions(ctx context.Context, orgID string, roleID string, req request.ReplaceRolePermissionsRequest) (*response.OrgRoleResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListRoles(ctx context.Context, orgID string, q request.ListRolesQuery) ([]response.OrgRoleResponse, *apperrors.Error) {
	roles, err := s.repo.ListRoles(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}
	return mapper.ToOrgRoleList(roles), nil
}

func (s *service) ReplaceAccountRoles(ctx context.Context, orgID, accountID string, req request.ReplaceAccountRolesRequest) *apperrors.Error {
	belongs, err := s.repo.AccountBelongsToOrg(ctx, orgID, accountID)
	if err != nil {
		return apperrors.Internal()
	}
	if !belongs {
		return apperrors.NotFound("Organization account not found")
	}

	if err := s.repo.ReplaceAccountRoles(ctx, orgID, accountID, req.Assignments); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]response.PermissionResponse, int, int, int64, *apperrors.Error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 50
	}

	perms, total, err := s.repo.ListPermissions(ctx, q)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}
	return mapper.ToPermissionList(perms), page, pageSize, total, nil
}

func (s *service) UpdateRolePermissions(ctx context.Context, orgID string, roleID string, req request.ReplaceRolePermissionsRequest) (*response.OrgRoleResponse, *apperrors.Error) {
	role, err := s.repo.ReplaceRolePermissions(ctx, orgID, roleID, req.PermissionIDs)
	if err != nil {
		return nil, apperrors.Internal()
	}
	res := mapper.ToOrgRoleResponse(role)
	return &res, nil
}
