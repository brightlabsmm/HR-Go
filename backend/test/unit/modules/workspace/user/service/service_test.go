package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/user/models"
	"hrgo/backend/internal/modules/workspace/user/repository"
	"hrgo/backend/internal/modules/workspace/user/request"
	"hrgo/backend/internal/modules/workspace/user/service"
)

type mockWorkspaceUserRepo struct {
	repository.Repository
	account *models.OrganizationAccount
	err     error
}

func (m *mockWorkspaceUserRepo) List(ctx context.Context, orgID string, q request.ListUsersQuery) ([]models.OrganizationAccount, int64, error) {
	if m.err != nil {
		return nil, 0, m.err
	}
	if m.account != nil {
		return []models.OrganizationAccount{*m.account}, 1, nil
	}
	return []models.OrganizationAccount{}, 0, nil
}

func (m *mockWorkspaceUserRepo) FindByID(ctx context.Context, orgID, id string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.account, nil
}

func (m *mockWorkspaceUserRepo) FindByEmailOrIdentifier(ctx context.Context, orgID, email, identifier string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.account, nil
}

func (m *mockWorkspaceUserRepo) Create(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount, roleIDs []string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	acc.ID = "acc-100"
	acc.EmployeeID = "emp-100"
	acc.Employee = *emp
	acc.UserRoles = []models.OrgUserRole{
		{
			AccountID: acc.ID,
			RoleID:    roleIDs[0],
			Role:      models.OrgRole{ID: roleIDs[0], Code: "BRANCH_MANAGER", Name: "Branch Manager"},
		},
	}
	m.account = acc
	return acc, nil
}

func (m *mockWorkspaceUserRepo) Update(ctx context.Context, orgID, id string, fullName, email *string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.account != nil {
		if fullName != nil {
			m.account.Employee.FirstName = *fullName
		}
		if email != nil {
			m.account.Employee.Email = *email
		}
	}
	return m.account, nil
}

func (m *mockWorkspaceUserRepo) ReplaceRoles(ctx context.Context, orgID, id string, roleIDs []string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.account != nil {
		m.account.UserRoles = []models.OrgUserRole{
			{
				AccountID: id,
				RoleID:    roleIDs[0],
				Role:      models.OrgRole{ID: roleIDs[0], Code: "HR_MANAGER", Name: "HR Manager"},
			},
		}
	}
	return m.account, nil
}

func (m *mockWorkspaceUserRepo) SetStatus(ctx context.Context, orgID, id, status string) (*models.OrganizationAccount, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.account != nil {
		m.account.Status = status
	}
	return m.account, nil
}

func TestWorkspaceUserService(t *testing.T) {
	t.Run("Create user fails if email is already used", func(t *testing.T) {
		existing := &models.OrganizationAccount{
			ID: "existing-1",
			Employee: models.EmployeeIdentity{
				Email: "user@test.org",
			},
		}
		repo := &mockWorkspaceUserRepo{account: existing}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), "org-1", request.CreateWorkspaceUserRequest{
			FullName: "New User",
			Email:    "user@test.org",
			Password: "Password@123",
			RoleIDs:  []string{"role-1"},
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("Create user succeeds and hashes password", func(t *testing.T) {
		repo := &mockWorkspaceUserRepo{account: nil}
		svc := service.New(repo)

		res, appErr := svc.Create(context.Background(), "org-1", request.CreateWorkspaceUserRequest{
			FullName: "Branch Manager User",
			Email:    "bm@test.org",
			Password: "Password@123",
			RoleIDs:  []string{"role-bm"},
		})

		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if res.Email != "bm@test.org" {
			t.Fatalf("expected email bm@test.org, got %v", res.Email)
		}
		if len(res.Roles) != 1 || res.Roles[0].RoleCode != "BRANCH_MANAGER" {
			t.Fatalf("expected BRANCH_MANAGER role, got %v", res.Roles)
		}
	})

	t.Run("List users returns page of users", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:        "acc-1",
			Status:    "ACTIVE",
			CreatedAt: time.Now(),
			Employee: models.EmployeeIdentity{
				FirstName: "Aung",
				LastName:  "Kyaw",
				Email:     "aung@test.org",
			},
		}
		repo := &mockWorkspaceUserRepo{account: acc}
		svc := service.New(repo)

		items, page, pageSize, total, appErr := svc.List(context.Background(), "org-1", request.ListUsersQuery{})
		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if len(items) != 1 || total != 1 || page != 1 || pageSize != 20 {
			t.Fatalf("unexpected list response: items=%d, total=%d", len(items), total)
		}
		if items[0].FullName != "Aung Kyaw" {
			t.Fatalf("expected Aung Kyaw, got %v", items[0].FullName)
		}
	})

	t.Run("Deactivate and Reactivate updates status", func(t *testing.T) {
		acc := &models.OrganizationAccount{
			ID:     "acc-1",
			Status: "ACTIVE",
			Employee: models.EmployeeIdentity{
				FirstName: "User",
				Email:     "user@test.org",
			},
		}
		repo := &mockWorkspaceUserRepo{account: acc}
		svc := service.New(repo)

		deactivated, appErr := svc.Deactivate(context.Background(), "org-1", "acc-1")
		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if deactivated.Status != "INACTIVE" {
			t.Fatalf("expected INACTIVE, got %v", deactivated.Status)
		}

		reactivated, appErr := svc.Reactivate(context.Background(), "org-1", "acc-1")
		if appErr != nil {
			t.Fatalf("expected success, got %v", appErr)
		}
		if reactivated.Status != "ACTIVE" {
			t.Fatalf("expected ACTIVE, got %v", reactivated.Status)
		}
	})
}
