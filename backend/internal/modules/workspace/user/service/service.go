package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/user/mapper"
	"hrgo/backend/internal/modules/workspace/user/models"
	"hrgo/backend/internal/modules/workspace/user/repository"
	"hrgo/backend/internal/modules/workspace/user/request"
	"hrgo/backend/internal/modules/workspace/user/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type Service interface {
	List(ctx context.Context, orgID string, q request.ListUsersQuery) ([]response.WorkspaceUserResponse, int, int, int64, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error)
	Create(ctx context.Context, orgID string, req request.CreateWorkspaceUserRequest) (*response.WorkspaceUserResponse, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdateWorkspaceUserRequest) (*response.WorkspaceUserResponse, *apperrors.Error)
	ReplaceRoles(ctx context.Context, orgID, id string, req request.ReplaceRolesRequest) (*response.WorkspaceUserResponse, *apperrors.Error)
	Deactivate(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error)
	Reactivate(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) List(ctx context.Context, orgID string, q request.ListUsersQuery) ([]response.WorkspaceUserResponse, int, int, int64, *apperrors.Error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	accounts, total, err := s.repo.List(ctx, orgID, q)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}

	return mapper.ToWorkspaceUserList(accounts), page, pageSize, total, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error) {
	acc, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil {
		return nil, apperrors.NotFound("Organization user not found")
	}

	res := mapper.ToWorkspaceUserResponse(acc)
	return &res, nil
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreateWorkspaceUserRequest) (*response.WorkspaceUserResponse, *apperrors.Error) {
	email := strings.TrimSpace(req.Email)
	existing, err := s.repo.FindByEmailOrIdentifier(ctx, orgID, email, email)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existing != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "email", Message: "Email address is already in use in this organization."},
		})
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, apperrors.Internal()
	}

	parts := strings.Fields(strings.TrimSpace(req.FullName))
	firstName := req.FullName
	lastName := ""
	if len(parts) > 1 {
		firstName = parts[0]
		lastName = strings.Join(parts[1:], " ")
	}

	codePrefix := strings.ToUpper(strings.Split(email, "@")[0])
	empCode := fmt.Sprintf("%s-%d", codePrefix, time.Now().Unix()%10000)

	emp := &models.EmployeeIdentity{
		OrganizationID: orgID,
		EmployeeCode:   empCode,
		FirstName:      firstName,
		LastName:       lastName,
		Email:          email,
	}

	acc := &models.OrganizationAccount{
		OrganizationID:     orgID,
		Identifier:         email,
		PasswordHash:       hash,
		Status:             "ACTIVE",
		MustChangePassword: true,
	}

	created, err := s.repo.Create(ctx, emp, acc, req.RoleIDs)
	if err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToWorkspaceUserResponse(created)
	return &res, nil
}

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdateWorkspaceUserRequest) (*response.WorkspaceUserResponse, *apperrors.Error) {
	if req.Email != nil {
		email := strings.TrimSpace(*req.Email)
		existing, err := s.repo.FindByEmailOrIdentifier(ctx, orgID, email, email)
		if err != nil {
			return nil, apperrors.Internal()
		}
		if existing != nil && existing.ID != id {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "email", Message: "Email address is already in use in this organization."},
			})
		}
	}

	updated, err := s.repo.Update(ctx, orgID, id, req.FullName, req.Email)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if updated == nil {
		return nil, apperrors.NotFound("Organization user not found")
	}

	res := mapper.ToWorkspaceUserResponse(updated)
	return &res, nil
}

func (s *service) ReplaceRoles(ctx context.Context, orgID, id string, req request.ReplaceRolesRequest) (*response.WorkspaceUserResponse, *apperrors.Error) {
	updated, err := s.repo.ReplaceRoles(ctx, orgID, id, req.RoleIDs)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if updated == nil {
		return nil, apperrors.NotFound("Organization user not found")
	}

	res := mapper.ToWorkspaceUserResponse(updated)
	return &res, nil
}

func (s *service) Deactivate(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error) {
	updated, err := s.repo.SetStatus(ctx, orgID, id, "INACTIVE")
	if err != nil {
		return nil, apperrors.Internal()
	}
	if updated == nil {
		return nil, apperrors.NotFound("Organization user not found")
	}

	res := mapper.ToWorkspaceUserResponse(updated)
	return &res, nil
}

func (s *service) Reactivate(ctx context.Context, orgID, id string) (*response.WorkspaceUserResponse, *apperrors.Error) {
	updated, err := s.repo.SetStatus(ctx, orgID, id, "ACTIVE")
	if err != nil {
		return nil, apperrors.Internal()
	}
	if updated == nil {
		return nil, apperrors.NotFound("Organization user not found")
	}

	res := mapper.ToWorkspaceUserResponse(updated)
	return &res, nil
}
