package service

import (
	"context"

	"hrgo/backend/internal/modules/control/patchversion/mapper"
	"hrgo/backend/internal/modules/control/patchversion/repository"
	"hrgo/backend/internal/modules/control/patchversion/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

// Service reads the current application patch version.
type Service interface {
	Current(ctx context.Context) (*response.PatchVersionResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Current(ctx context.Context) (*response.PatchVersionResponse, *apperrors.Error) {
	row, err := s.repo.FindCurrent(ctx)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if row == nil {
		return nil, apperrors.NotFound("Current patch version not found")
	}
	res := mapper.ToPatchVersionResponse(row)
	return &res, nil
}
