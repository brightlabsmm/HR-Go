package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/control/user/mapper"
	"hrgo/backend/internal/modules/control/user/models"
	"hrgo/backend/internal/modules/control/user/repository"
	"hrgo/backend/internal/modules/control/user/request"
	"hrgo/backend/internal/modules/control/user/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type Service interface {
	Create(ctx context.Context, req request.CreatePlatformUserRequest) (*response.PlatformUserResponse, *apperrors.Error)
	GetByID(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error)
	List(ctx context.Context, q request.ListUsersQuery) ([]response.PlatformUserResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, id string, req request.UpdatePlatformUserRequest) (*response.PlatformUserResponse, *apperrors.Error)
	ReplaceRoles(ctx context.Context, id string, req request.ReplaceRolesRequest) (*response.PlatformUserResponse, *apperrors.Error)
	Deactivate(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error)
	Reactivate(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req request.CreatePlatformUserRequest) (*response.PlatformUserResponse, *apperrors.Error) {
	email := strings.TrimSpace(req.Email)
	existing, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existing != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "email", Message: "Email address is already in use."},
		})
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, apperrors.Internal()
	}

	u := &models.PlatformUser{
		FullName:     req.FullName,
		Email:        email,
		PasswordHash: hash,
		Status:       "ACTIVE",
	}

	if err := s.repo.Create(ctx, u, req.RoleIDs); err != nil {
		return nil, apperrors.Internal()
	}

	created, _ := s.repo.FindByID(ctx, u.ID)
	res := mapper.ToPlatformUserResponse(created)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if u == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}
	res := mapper.ToPlatformUserResponse(u)
	return &res, nil
}

func (s *service) List(ctx context.Context, q request.ListUsersQuery) ([]response.PlatformUserResponse, int, int, int64, *apperrors.Error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.repo.List(ctx, q)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}
	return mapper.ToPlatformUserList(items), page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, id string, req request.UpdatePlatformUserRequest) (*response.PlatformUserResponse, *apperrors.Error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if u == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}

	if req.FullName != nil {
		u.FullName = *req.FullName
	}
	if req.Email != nil {
		u.Email = strings.TrimSpace(*req.Email)
	}

	if err := s.repo.Update(ctx, u); err != nil {
		return nil, apperrors.Internal()
	}
	res := mapper.ToPlatformUserResponse(u)
	return &res, nil
}

func (s *service) ReplaceRoles(ctx context.Context, id string, req request.ReplaceRolesRequest) (*response.PlatformUserResponse, *apperrors.Error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if u == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}

	if err := s.repo.ReplaceRoles(ctx, id, req.RoleIDs); err != nil {
		return nil, apperrors.Internal()
	}

	updated, _ := s.repo.FindByID(ctx, id)
	res := mapper.ToPlatformUserResponse(updated)
	return &res, nil
}

func (s *service) Deactivate(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if u == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}

	u.Status = "INACTIVE"
	if err := s.repo.Update(ctx, u); err != nil {
		return nil, apperrors.Internal()
	}
	res := mapper.ToPlatformUserResponse(u)
	return &res, nil
}

func (s *service) Reactivate(ctx context.Context, id string) (*response.PlatformUserResponse, *apperrors.Error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if u == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}

	u.Status = "ACTIVE"
	if err := s.repo.Update(ctx, u); err != nil {
		return nil, apperrors.Internal()
	}
	res := mapper.ToPlatformUserResponse(u)
	return &res, nil
}
