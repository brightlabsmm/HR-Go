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
	ListRoles(ctx context.Context, orgID string) ([]response.OrgRoleResponse, *apperrors.Error)
	ReplaceAccountRoles(ctx context.Context, orgID, accountID string, req request.ReplaceAccountRolesRequest) *apperrors.Error
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) ListRoles(ctx context.Context, orgID string) ([]response.OrgRoleResponse, *apperrors.Error) {
	roles, err := s.repo.ListRoles(ctx, orgID)
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
