package service

import (
	"context"
	"strings"
	"time"

	"hrgo/backend/internal/modules/control/auth/mapper"
	"hrgo/backend/internal/modules/control/auth/models"
	"hrgo/backend/internal/modules/control/auth/repository"
	"hrgo/backend/internal/modules/control/auth/request"
	"hrgo/backend/internal/modules/control/auth/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type Service interface {
	Login(ctx context.Context, req request.LoginRequest) (*response.LoginResponse, *apperrors.Error)
	GetMe(ctx context.Context, userID string) (*response.UserProfile, *apperrors.Error)
	EnsureSuperadmin(ctx context.Context, email, password, fullName string) error
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

func (s *service) Login(ctx context.Context, req request.LoginRequest) (*response.LoginResponse, *apperrors.Error) {
	email := strings.TrimSpace(req.Email)
	if s.lockout != nil && s.lockout.IsLocked(email) {
		return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
	}

	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if user == nil || !security.CheckPassword(user.PasswordHash, req.Password) {
		if s.lockout != nil {
			if locked := s.lockout.RecordFailure(email); locked {
				return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
			}
		}
		return nil, apperrors.Unauthorized("Invalid email or password.")
	}

	if s.lockout != nil {
		s.lockout.Reset(email)
	}

	if user.Status != "ACTIVE" {
		return nil, apperrors.Forbidden("Platform account is " + user.Status)
	}

	perms := extractPermissions(user.Roles)
	token, exp, err := s.tokens.GeneratePlatformToken(user.ID, user.Email, perms)
	if err != nil {
		return nil, apperrors.Internal()
	}

	_ = s.repo.UpdateLastLogin(ctx, user.ID)

	profile := mapper.ToUserProfile(user, perms)
	return &response.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   exp,
		User:        profile,
	}, nil
}

func (s *service) GetMe(ctx context.Context, userID string) (*response.UserProfile, *apperrors.Error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if user == nil {
		return nil, apperrors.NotFound("Platform user not found")
	}

	perms := extractPermissions(user.Roles)
	profile := mapper.ToUserProfile(user, perms)
	return &profile, nil
}

func (s *service) EnsureSuperadmin(ctx context.Context, email, password, fullName string) error {
	hash, err := security.HashPassword(password)
	if err != nil {
		return err
	}
	return s.repo.EnsureSuperadmin(ctx, email, fullName, hash)
}

func extractPermissions(roles []models.PlatformRole) []string {
	set := make(map[string]struct{})
	for _, r := range roles {
		for _, p := range r.Permissions {
			set[p.Code] = struct{}{}
		}
	}
	res := make([]string, 0, len(set))
	for p := range set {
		res = append(res, p)
	}
	return res
}
