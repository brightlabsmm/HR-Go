package service

import (
	"context"

	"hrgo/backend/internal/modules/control/role/mapper"
	"hrgo/backend/internal/modules/control/role/repository"
	"hrgo/backend/internal/modules/control/role/request"
	"hrgo/backend/internal/modules/control/role/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	ListRoles(ctx context.Context) ([]response.RoleResponse, *apperrors.Error)
	ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]response.PermissionResponse, int, int, int64, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListRoles(ctx context.Context) ([]response.RoleResponse, *apperrors.Error) {
	roles, err := s.repo.ListRoles(ctx)
	if err != nil {
		return nil, apperrors.Internal()
	}
	return mapper.ToRoleList(roles), nil
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
