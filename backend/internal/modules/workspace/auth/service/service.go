package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"hrgo/backend/internal/modules/workspace/auth/mapper"
	"hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/auth/repository"
	"hrgo/backend/internal/modules/workspace/auth/request"
	"hrgo/backend/internal/modules/workspace/auth/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type SessionMetadata struct {
	IPAddress *string
	UserAgent *string
}

type Service interface {
	Login(ctx context.Context, req request.LoginRequest, meta ...SessionMetadata) (*response.LoginResponse, *apperrors.Error)
	Logout(ctx context.Context, sessionID string) *apperrors.Error
	GetMe(ctx context.Context, accountID string) (*response.WorkspaceUserProfile, *apperrors.Error)
	ChangePassword(ctx context.Context, accountID string, req request.ChangePasswordRequest) *apperrors.Error
}

type service struct {
	repo    repository.Repository
	tokens  *security.TokenManager
	lockout *security.LockoutManager
}

func New(repo repository.Repository, tokens *security.TokenManager, lockout ...*security.LockoutManager) Service {
	var lm *security.LockoutManager
	if len(lockout) > 0 && lockout[0] != nil {
		lm = lockout[0]
	} else {
		lm = security.NewLockoutManager(5, 15*time.Minute)
	}
	return &service{repo: repo, tokens: tokens, lockout: lm}
}

func (s *service) Login(ctx context.Context, req request.LoginRequest, meta ...SessionMetadata) (*response.LoginResponse, *apperrors.Error) {
	ident := strings.TrimSpace(req.Identifier)
	if s.lockout != nil && s.lockout.IsLocked(ident) {
		return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
	}

	acc, err := s.repo.FindByIdentifier(ctx, req.Identifier)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil || !security.CheckPassword(acc.PasswordHash, req.Password) {
		if s.lockout != nil {
			if locked := s.lockout.RecordFailure(ident); locked {
				return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
			}
		}
		return nil, apperrors.Unauthorized("Invalid employee identifier or password.")
	}

	if s.lockout != nil {
		s.lockout.Reset(ident)
	}

	now := time.Now().UTC()
	if acc.Organization.DeletedAt != nil {
		return nil, apperrors.Forbidden("Organization has been deleted. Sign in is disabled.")
	}

	if acc.Organization.Status != "ACTIVE" {
		return nil, apperrors.Forbidden("Organization is " + strings.ToLower(acc.Organization.Status) + ". Sign in is disabled.")
	}

	if acc.Organization.ScheduledSuspendAt != nil && !now.Before(*acc.Organization.ScheduledSuspendAt) {
		return nil, apperrors.Forbidden("Organization has been suspended. Sign in is disabled.")
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

	sessionID := uuid.NewString()
	expSeconds := int64(24 * 3600)
	token, exp, err := s.tokens.GenerateWorkspaceTokenWithSession(
		sessionID,
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
	if exp > 0 {
		expSeconds = exp
	}

	var ipAddr, userAgent *string
	if len(meta) > 0 {
		ipAddr = meta[0].IPAddress
		userAgent = meta[0].UserAgent
	}

	session := &models.WorkspaceSession{
		ID:             sessionID,
		OrganizationID: acc.OrganizationID,
		AccountID:      acc.ID,
		IPAddress:      ipAddr,
		UserAgent:      userAgent,
		CreatedAt:      now,
		ExpiresAt:      now.Add(time.Duration(expSeconds) * time.Second),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, apperrors.Internal()
	}

	_ = s.repo.UpdateLastLogin(ctx, acc.ID)

	profile := mapper.ToWorkspaceUserProfile(acc, perms)
	return &response.LoginResponse{
		AccessToken:        token,
		TokenType:          "Bearer",
		ExpiresIn:          expSeconds,
		MustChangePassword: acc.MustChangePassword,
		User:               profile,
	}, nil
}

func (s *service) Logout(ctx context.Context, sessionID string) *apperrors.Error {
	if sessionID != "" {
		_ = s.repo.RevokeSession(ctx, sessionID, "USER_LOGOUT")
	}
	return nil
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

func (s *service) ChangePassword(ctx context.Context, accountID string, req request.ChangePasswordRequest) *apperrors.Error {
	acc, err := s.repo.FindByID(ctx, accountID)
	if err != nil {
		return apperrors.Internal()
	}
	if acc == nil {
		return apperrors.NotFound("Organization account not found")
	}

	if !security.CheckPassword(acc.PasswordHash, req.CurrentPassword) {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "currentPassword", Message: "Current password is incorrect."},
		})
	}

	if req.CurrentPassword == req.NewPassword {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "newPassword", Message: "New password must be different from current password."},
		})
	}

	if req.ConfirmPassword != "" && req.NewPassword != req.ConfirmPassword {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "confirmPassword", Message: "Passwords do not match."},
		})
	}

	if err := security.ValidatePasswordStrength(req.NewPassword); err != nil {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "newPassword", Message: err.Error()},
		})
	}

	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return apperrors.Internal()
	}

	if err := s.repo.UpdatePassword(ctx, acc.ID, hash, false); err != nil {
		return apperrors.Internal()
	}

	return nil
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
