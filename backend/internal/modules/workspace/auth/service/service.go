package service

import (
	"context"

	"hrgo/backend/internal/modules/workspace/auth/mapper"
	"hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/auth/repository"
	"hrgo/backend/internal/modules/workspace/auth/request"
	"hrgo/backend/internal/modules/workspace/auth/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type Service interface {
	Login(ctx context.Context, req request.LoginRequest) (*response.LoginResponse, *apperrors.Error)
	GetMe(ctx context.Context, accountID string) (*response.WorkspaceUserProfile, *apperrors.Error)
}

type service struct {
	repo   repository.Repository
	tokens *security.TokenManager
}

func New(repo repository.Repository, tokens *security.TokenManager) Service {
	return &service{repo: repo, tokens: tokens}
}

func (s *service) Login(ctx context.Context, req request.LoginRequest) (*response.LoginResponse, *apperrors.Error) {
	acc, err := s.repo.FindByIdentifier(ctx, req.Identifier)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil || !security.CheckPassword(acc.PasswordHash, req.Password) {
		return nil, apperrors.Unauthorized("Invalid employee identifier or password.")
	}

	if acc.Status != "ACTIVE" {
		return nil, apperrors.Forbidden("Organization account is " + acc.Status)
	}

	perms := extractWorkspacePermissions(acc.UserRoles)

	var branchID, deptID string
	if len(acc.UserRoles) > 0 {
		if acc.UserRoles[0].BranchID != nil {
			branchID = *acc.UserRoles[0].BranchID
		}
		if acc.UserRoles[0].DepartmentID != nil {
			deptID = *acc.UserRoles[0].DepartmentID
		}
	}

	token, exp, err := s.tokens.GenerateWorkspaceToken(
		acc.ID,
		acc.OrganizationID,
		acc.EmployeeID,
		acc.Employee.EmployeeCode,
		branchID,
		deptID,
		perms,
	)
	if err != nil {
		return nil, apperrors.Internal()
	}

	_ = s.repo.UpdateLastLogin(ctx, acc.ID)

	profile := mapper.ToWorkspaceUserProfile(acc, perms)
	return &response.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   exp,
		User:        profile,
	}, nil
}

func (s *service) GetMe(ctx context.Context, accountID string) (*response.WorkspaceUserProfile, *apperrors.Error) {
	acc, err := s.repo.FindByID(ctx, accountID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil {
		return nil, apperrors.NotFound("Organization account not found")
	}

	perms := extractWorkspacePermissions(acc.UserRoles)
	profile := mapper.ToWorkspaceUserProfile(acc, perms)
	return &profile, nil
}

func extractWorkspacePermissions(roles []models.OrgUserRole) []string {
	set := make(map[string]struct{})
	for _, ur := range roles {
		for _, p := range ur.Role.Permissions {
			set[p.Code] = struct{}{}
		}
	}
	res := make([]string, 0, len(set))
	for p := range set {
		res = append(res, p)
	}
	return res
}
