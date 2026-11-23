package service_test

import (
	"context"
	"testing"

	"hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/auth/repository"
	"hrgo/backend/internal/modules/workspace/auth/request"
	"hrgo/backend/internal/modules/workspace/auth/service"
	"hrgo/backend/internal/shared/security"
)

type mockWorkspaceAuthRepo struct {
	repository.Repository
	account        *models.OrganizationAccount
	lastLoginId    string
	updatedAccId   string
	updatedHash    string
	updatedMustChg bool
	err            error
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
}
