package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/auth/repository"
	"hrgo/backend/internal/modules/workspace/auth/request"
	"hrgo/backend/internal/modules/workspace/auth/service"
	"hrgo/backend/internal/shared/security"
)

type mockWorkspaceAuthRepo struct {
	repository.Repository
	account          *models.OrganizationAccount
	lastLoginId      string
	updatedAccId     string
	updatedHash      string
	updatedMustChg   bool
	createdSession   *models.WorkspaceSession
	revokedSessionId string
	err              error
}

func (m *mockWorkspaceAuthRepo) FindByIdentifier(ctx context.Context, identifier string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.account, nil
}

func (m *mockWorkspaceAuthRepo) FindByID(ctx context.Context, id string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.account, nil
}

func (m *mockWorkspaceAuthRepo) UpdateLastLogin(ctx context.Context, id string) error {
	m.lastLoginId = id
	return nil
}

func (m *mockWorkspaceAuthRepo) UpdatePassword(ctx context.Context, id string, passwordHash string, mustChangePassword bool) error {
	m.updatedAccId = id
	m.updatedHash = passwordHash
	m.updatedMustChg = mustChangePassword
	if m.account != nil {
		m.account.PasswordHash = passwordHash
		m.account.MustChangePassword = mustChangePassword
	}
	return nil
}

func (m *mockWorkspaceAuthRepo) CreateSession(ctx context.Context, session *models.WorkspaceSession) error {
	m.createdSession = session
	return nil
}

func (m *mockWorkspaceAuthRepo) RevokeSession(ctx context.Context, sessionID string, reason string) error {
	if m.err != nil {
		return m.err
	}
	m.revokedSessionId = sessionID
	return nil
}

func (m *mockWorkspaceAuthRepo) FindSessionByID(ctx context.Context, sessionID string) (*models.WorkspaceSession, error) {
	return nil, nil
}

func TestWorkspaceAuthService_Login(t *testing.T) {
	tokens := security.NewTokenManager("test-secret-must-be-at-least-32-bytes-long")
	hashedPass, _ := security.HashPassword("InitialPass@123")

	t.Run("returns mustChangePassword=true on first login", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			OrganizationID:     "org-1",
			EmployeeID:         "emp-1",
			Identifier:         "QA1119-B01",
			PasswordHash:       hashedPass,
			Status:             "ACTIVE",
			MustChangePassword: true,
			Organization: models.Organization{
				ID:     "org-1",
				Status: "ACTIVE",
			},
		}

		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "QA1119-B01",
			Password:   "InitialPass@123",
		})

		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if !res.MustChangePassword {
			t.Fatalf("expected res.MustChangePassword to be true")
		}
		if !res.User.MustChangePassword {
			t.Fatalf("expected res.User.MustChangePassword to be true")
		}
	})

	t.Run("returns mustChangePassword=false after password changed", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-2",
			OrganizationID:     "org-1",
			EmployeeID:         "emp-2",
			Identifier:         "QA1119-B02",
			PasswordHash:       hashedPass,
			Status:             "ACTIVE",
			MustChangePassword: false,
			Organization: models.Organization{
				ID:     "org-1",
				Status: "ACTIVE",
			},
		}

		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "QA1119-B02",
			Password:   "InitialPass@123",
		})

		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if res.MustChangePassword {
			t.Fatalf("expected res.MustChangePassword to be false")
		}
		if res.User.MustChangePassword {
			t.Fatalf("expected res.User.MustChangePassword to be false")
		}
	})
}

func TestWorkspaceAuthService_ChangePassword(t *testing.T) {
	tokens := security.NewTokenManager("test-secret-must-be-at-least-32-bytes-long")
	hashedPass, _ := security.HashPassword("InitialPass@123")

	t.Run("fails when current password is incorrect", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			PasswordHash:       hashedPass,
			MustChangePassword: true,
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		appErr := svc.ChangePassword(context.Background(), "acc-1", request.ChangePasswordRequest{
			CurrentPassword: "WrongPassword@123",
			NewPassword:     "NewPassword@123",
			ConfirmPassword: "NewPassword@123",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("fails when new password matches current password", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			PasswordHash:       hashedPass,
			MustChangePassword: true,
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		appErr := svc.ChangePassword(context.Background(), "acc-1", request.ChangePasswordRequest{
			CurrentPassword: "InitialPass@123",
			NewPassword:     "InitialPass@123",
			ConfirmPassword: "InitialPass@123",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("fails when confirmation password does not match", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			PasswordHash:       hashedPass,
			MustChangePassword: true,
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		appErr := svc.ChangePassword(context.Background(), "acc-1", request.ChangePasswordRequest{
			CurrentPassword: "InitialPass@123",
			NewPassword:     "NewPassword@123",
			ConfirmPassword: "DifferentPassword@123",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("fails when new password fails complexity or is common weak password", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			PasswordHash:       hashedPass,
			MustChangePassword: true,
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		for _, weak := range []string{"12345678", "password", "Admin123", "short1"} {
			appErr := svc.ChangePassword(context.Background(), "acc-1", request.ChangePasswordRequest{
				CurrentPassword: "InitialPass@123",
				NewPassword:     weak,
				ConfirmPassword: weak,
			})

			if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
				t.Errorf("expected VALIDATION_ERROR for weak password %q, got %v", weak, appErr)
			}
		}
	})

	t.Run("successfully updates password and clears mustChangePassword flag", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:                 "acc-1",
			PasswordHash:       hashedPass,
			MustChangePassword: true,
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		appErr := svc.ChangePassword(context.Background(), "acc-1", request.ChangePasswordRequest{
			CurrentPassword: "InitialPass@123",
			NewPassword:     "NewValidPassword@123",
			ConfirmPassword: "NewValidPassword@123",
		})

		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}

		if repo.updatedAccId != "acc-1" {
			t.Fatalf("expected updatedAccId=acc-1, got %v", repo.updatedAccId)
		}
		if repo.updatedMustChg != false {
			t.Fatalf("expected updatedMustChg=false, got %v", repo.updatedMustChg)
		}
		if !security.CheckPassword(repo.updatedHash, "NewValidPassword@123") {
			t.Fatalf("expected updated hash to match new password")
		}
	})

	t.Run("temporarily locks out account after repeated failed login attempts (BUG-17)", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:           "acc-lock",
			Identifier:   "EMP-LOCKOUT",
			PasswordHash: hashedPass,
			Status:       "ACTIVE",
			Organization: models.Organization{Status: "ACTIVE"},
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		// 1st to 4th failed attempts return 401 UNAUTHORIZED
		for i := 1; i <= 4; i++ {
			res, appErr := svc.Login(context.Background(), request.LoginRequest{
				Identifier: "EMP-LOCKOUT",
				Password:   "WrongPassword",
			})
			if res != nil {
				t.Fatalf("attempt %d: expected nil response on bad password", i)
			}
			if appErr == nil || appErr.Status != 401 {
				t.Fatalf("attempt %d: expected 401 UNAUTHORIZED, got %v", i, appErr)
			}
		}

		// 5th failed attempt triggers lockout (429 RATE_LIMIT_EXCEEDED)
		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "EMP-LOCKOUT",
			Password:   "WrongPassword",
		})
		if res != nil {
			t.Fatal("attempt 5: expected nil response")
		}
		if appErr == nil || appErr.Status != 429 || appErr.Code != "RATE_LIMIT_EXCEEDED" {
			t.Fatalf("attempt 5: expected 429 RATE_LIMIT_EXCEEDED on lockout trigger, got %v", appErr)
		}

		// 6th attempt with the RIGHT password is STILL blocked due to temporary lockout!
		res, appErr = svc.Login(context.Background(), request.LoginRequest{
			Identifier: "EMP-LOCKOUT",
			Password:   "InitialPass@123", // Correct password!
		})
		if res != nil {
			t.Fatal("attempt 6: expected nil response while locked out")
		}
		if appErr == nil || appErr.Status != 429 || appErr.Code != "RATE_LIMIT_EXCEEDED" {
			t.Fatalf("attempt 6: expected 429 RATE_LIMIT_EXCEEDED for correct password during lockout, got %v", appErr)
		}
	})

	t.Run("blocks login when organization scheduled suspension has arrived", func(t *testing.T) {
		past := time.Now().UTC().Add(-10 * time.Minute)
		acc := &models.OrganizationAccount{
			ID:           "acc-due",
			Identifier:   "EMP-DUE",
			PasswordHash: hashedPass,
			Status:       "ACTIVE",
			Organization: models.Organization{
				ID:                 "org-due",
				Status:             "ACTIVE",
				ScheduledSuspendAt: &past,
			},
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "EMP-DUE",
			Password:   "InitialPass@123",
		})
		if res != nil {
			t.Fatal("expected nil response when org is due for suspension")
		}
		if appErr == nil || appErr.Status != 403 {
			t.Fatalf("expected 403 FORBIDDEN, got %v", appErr)
		}
	})

	t.Run("creates session on successful login and revokes on logout", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:             "acc-sess",
			OrganizationID: "org-sess",
			Identifier:     "EMP-SESS",
			PasswordHash:   hashedPass,
			Status:         "ACTIVE",
			Organization: models.Organization{
				ID:     "org-sess",
				Status: "ACTIVE",
			},
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "EMP-SESS",
			Password:   "InitialPass@123",
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res == nil || res.AccessToken == "" {
			t.Fatal("expected valid login response with access token")
		}
		if repo.createdSession == nil {
			t.Fatal("expected session to be created in DB")
		}
		if repo.createdSession.OrganizationID != "org-sess" {
			t.Errorf("orgID = %s, want org-sess", repo.createdSession.OrganizationID)
		}

		// Now logout
		logoutErr := svc.Logout(context.Background(), repo.createdSession.ID)
		if logoutErr != nil {
			t.Fatalf("unexpected logout error: %v", logoutErr)
		}
		if repo.revokedSessionId != repo.createdSession.ID {
			t.Errorf("revokedSessionId = %s, want %s", repo.revokedSessionId, repo.createdSession.ID)
		}

		// Logout error propagation when repository fails
		repo.err = errors.New("db error")
		logoutErr2 := svc.Logout(context.Background(), repo.createdSession.ID)
		if logoutErr2 == nil {
			t.Fatal("expected error from Logout when RevokeSession fails")
		}
		repo.err = nil
	})

	t.Run("returns suspensionNotice in user profile when within notice window", func(t *testing.T) {
		now := time.Now().UTC()
		notifyFrom := now.Add(-1 * time.Hour)
		notifyTo := now.Add(24 * time.Hour)
		schedAt := now.Add(24 * time.Hour)
		reason := "Scheduled maintenance"

		acc := &models.OrganizationAccount{
			ID:           "acc-notice",
			Identifier:   "EMP-NOTICE",
			PasswordHash: hashedPass,
			Status:       "ACTIVE",
			Organization: models.Organization{
				ID:                 "org-notice",
				Status:             "ACTIVE",
				SuspendNotifyFrom:  &notifyFrom,
				SuspendNotifyTo:    &notifyTo,
				ScheduledSuspendAt: &schedAt,
				SuspendReason:      &reason,
			},
		}
		repo := &mockWorkspaceAuthRepo{account: acc}
		svc := service.New(repo, tokens)

		res, appErr := svc.Login(context.Background(), request.LoginRequest{
			Identifier: "EMP-NOTICE",
			Password:   "InitialPass@123",
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.User.SuspensionNotice == nil {
			t.Fatal("expected suspensionNotice in user profile")
		}
		if res.User.SuspensionNotice.Reason != reason {
			t.Errorf("reason = %s, want %s", res.User.SuspensionNotice.Reason, reason)
		}
	})
}
