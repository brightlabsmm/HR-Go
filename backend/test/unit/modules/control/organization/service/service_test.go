package service_test

import (
	"context"
	"net/http"
	"testing"

	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/repository"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/service"
)

type mockOrgRepo struct {
	repository.Repository
	org          *models.Organization
	existingCode *models.Organization
	emp          *models.EmployeeIdentity
	acc          *models.OrganizationAccount
	adminDetails []models.AdminAccountDetail
	err          error
}

func (m *mockOrgRepo) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.org, nil
}

func (m *mockOrgRepo) FindByCode(ctx context.Context, code string) (*models.Organization, error) {
	if m.existingCode != nil && m.existingCode.Code == code {
		return m.existingCode, nil
	}
	if m.org != nil && m.org.Code == code {
		return m.org, nil
	}
	return nil, nil
}

func (m *mockOrgRepo) Create(ctx context.Context, org *models.Organization) error {
	org.ID = "org-created"
	m.org = org
	return nil
}

func (m *mockOrgRepo) Update(ctx context.Context, org *models.Organization) error {
	m.org = org
	return nil
}

func (m *mockOrgRepo) FindEmployeeByCode(ctx context.Context, orgID string, code string) (*models.EmployeeIdentity, error) {
	return m.emp, nil
}

func (m *mockOrgRepo) FindAccountByIdentifier(ctx context.Context, orgID string, identifier string) (*models.OrganizationAccount, error) {
	return m.acc, nil
}

func (m *mockOrgRepo) CreateAdminAccount(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount) (*models.AdminAccountDetail, error) {
	return &models.AdminAccountDetail{
		AccountID:      "acc-1",
		OrganizationID: emp.OrganizationID,
		EmployeeID:     "emp-1",
		Identifier:     acc.Identifier,
		EmployeeCode:   emp.EmployeeCode,
		FirstName:      emp.FirstName,
		LastName:       emp.LastName,
		Email:          emp.Email,
		RoleCode:       "ORG_ADMIN",
		RoleName:       "Org Admin",
		Status:         "ACTIVE",
	}, nil
}

func (m *mockOrgRepo) ListAdminAccounts(ctx context.Context, orgID string) ([]models.AdminAccountDetail, error) {
	return m.adminDetails, nil
}

func TestOrganizationStatusTransitions(t *testing.T) {
	tests := []struct {
		name          string
		initialStatus string
		targetStatus  string
		confirmation  bool
		expectErrCode string
		expectStatus  int
	}{
		// PENDING -> allowed: ACTIVE
		{
			name:          "PENDING to ACTIVE without confirmation succeeds",
			initialStatus: "PENDING",
			targetStatus:  "ACTIVE",
			confirmation:  false,
		},
		{
			name:          "PENDING to SUSPENDED rejected with 409 Conflict",
			initialStatus: "PENDING",
			targetStatus:  "SUSPENDED",
			confirmation:  true,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		{
			name:          "PENDING to ARCHIVED rejected with 409 Conflict",
			initialStatus: "PENDING",
			targetStatus:  "ARCHIVED",
			confirmation:  true,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		// ACTIVE -> allowed: SUSPENDED, ARCHIVED
		{
			name:          "ACTIVE to SUSPENDED without confirmation rejected with 400 Bad Request",
			initialStatus: "ACTIVE",
			targetStatus:  "SUSPENDED",
			confirmation:  false,
			expectErrCode: "BAD_REQUEST",
			expectStatus:  http.StatusBadRequest,
		},
		{
			name:          "ACTIVE to SUSPENDED with confirmation succeeds",
			initialStatus: "ACTIVE",
			targetStatus:  "SUSPENDED",
			confirmation:  true,
		},
		{
			name:          "ACTIVE to ARCHIVED without confirmation rejected with 400 Bad Request",
			initialStatus: "ACTIVE",
			targetStatus:  "ARCHIVED",
			confirmation:  false,
			expectErrCode: "BAD_REQUEST",
			expectStatus:  http.StatusBadRequest,
		},
		{
			name:          "ACTIVE to ARCHIVED with confirmation succeeds",
			initialStatus: "ACTIVE",
			targetStatus:  "ARCHIVED",
			confirmation:  true,
		},
		{
			name:          "ACTIVE to PENDING rejected with 409 Conflict",
			initialStatus: "ACTIVE",
			targetStatus:  "PENDING",
			confirmation:  false,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		// SUSPENDED -> allowed: ACTIVE, ARCHIVED
		{
			name:          "SUSPENDED to ACTIVE (Reactivate) succeeds",
			initialStatus: "SUSPENDED",
			targetStatus:  "ACTIVE",
			confirmation:  false,
		},
		{
			name:          "SUSPENDED to ARCHIVED with confirmation succeeds",
			initialStatus: "SUSPENDED",
			targetStatus:  "ARCHIVED",
			confirmation:  true,
		},
		{
			name:          "SUSPENDED to ARCHIVED without confirmation rejected with 400 Bad Request",
			initialStatus: "SUSPENDED",
			targetStatus:  "ARCHIVED",
			confirmation:  false,
			expectErrCode: "BAD_REQUEST",
			expectStatus:  http.StatusBadRequest,
		},
		{
			name:          "SUSPENDED to PENDING rejected with 409 Conflict",
			initialStatus: "SUSPENDED",
			targetStatus:  "PENDING",
			confirmation:  false,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		// ARCHIVED -> allowed: ACTIVE
		{
			name:          "ARCHIVED to ACTIVE (Reactivate) succeeds",
			initialStatus: "ARCHIVED",
			targetStatus:  "ACTIVE",
			confirmation:  false,
		},
		{
			name:          "ARCHIVED to SUSPENDED rejected with 409 Conflict",
			initialStatus: "ARCHIVED",
			targetStatus:  "SUSPENDED",
			confirmation:  true,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		{
			name:          "ARCHIVED to PENDING rejected with 409 Conflict",
			initialStatus: "ARCHIVED",
			targetStatus:  "PENDING",
			confirmation:  false,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		// Same status transition rejected
		{
			name:          "ACTIVE to ACTIVE rejected with 409 Conflict",
			initialStatus: "ACTIVE",
			targetStatus:  "ACTIVE",
			confirmation:  false,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			org := &models.Organization{
				ID:     "org-1",
				Code:   "001",
				Status: tt.initialStatus,
			}
			repo := &mockOrgRepo{org: org}
			svc := service.New(repo)

			res, appErr := svc.UpdateStatus(context.Background(), "org-1", request.UpdateStatusRequest{
				Status:       tt.targetStatus,
				Confirmation: tt.confirmation,
			})

			if tt.expectErrCode != "" {
				if appErr == nil {
					t.Fatalf("expected error code %s, got nil", tt.expectErrCode)
				}
				if appErr.Code != tt.expectErrCode {
					t.Errorf("expected error code %s, got %s", tt.expectErrCode, appErr.Code)
				}
				if appErr.Status != tt.expectStatus {
					t.Errorf("expected http status %d, got %d", tt.expectStatus, appErr.Status)
				}
			} else {
				if appErr != nil {
					t.Fatalf("unexpected error: %v", appErr)
				}
				if res == nil || res.Status != tt.targetStatus {
					t.Errorf("expected status %s, got %v", tt.targetStatus, res)
				}
			}
		})
	}
}

func TestCreateAdminAccount(t *testing.T) {
	org := &models.Organization{ID: "org-1", Code: "ORG-001", LegalName: "Acme", Status: "ACTIVE"}

	t.Run("creates admin account successfully", func(t *testing.T) {
		repo := &mockOrgRepo{org: org}
		svc := service.New(repo)

		email := "admin@acme.com"
		res, appErr := svc.CreateAdminAccount(context.Background(), "org-1", request.CreateAdminAccountRequest{
			FirstName:    "John",
			LastName:     "Doe",
			Email:        &email,
			EmployeeCode: "EMP-001",
			Password:     "Password@123",
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.Identifier != "EMP-001" || res.RoleCode != "ORG_ADMIN" {
			t.Errorf("unexpected response: %+v", res)
		}
	})

	t.Run("rejects duplicate employee code", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: org,
			emp: &models.EmployeeIdentity{ID: "emp-exist", EmployeeCode: "EMP-001"},
		}
		svc := service.New(repo)

		_, appErr := svc.CreateAdminAccount(context.Background(), "org-1", request.CreateAdminAccountRequest{
			FirstName:    "John",
			LastName:     "Doe",
			EmployeeCode: "EMP-001",
			Password:     "Password@123",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("rejects duplicate login identifier", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: org,
			acc: &models.OrganizationAccount{ID: "acc-exist", Identifier: "EMP-001"},
		}
		svc := service.New(repo)

		_, appErr := svc.CreateAdminAccount(context.Background(), "org-1", request.CreateAdminAccountRequest{
			FirstName:    "John",
			LastName:     "Doe",
			EmployeeCode: "EMP-001",
			Password:     "Password@123",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("returns 404 if org not found", func(t *testing.T) {
		repo := &mockOrgRepo{org: nil}
		svc := service.New(repo)

		_, appErr := svc.CreateAdminAccount(context.Background(), "missing-org", request.CreateAdminAccountRequest{
			FirstName:    "John",
			LastName:     "Doe",
			EmployeeCode: "EMP-001",
			Password:     "Password@123",
		})

		if appErr == nil || appErr.Status != http.StatusNotFound {
			t.Fatalf("expected 404, got %v", appErr)
		}
	})
}

func TestCreateOrganization(t *testing.T) {
	t.Run("succeeds with all required fields including contact", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		res, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ORG-001",
			LegalName:        "Acme Corp",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon, Myanmar",
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.OrganizationCode != "ORG-001" || res.ContactEmail != "contact@acme.com" {
			t.Errorf("unexpected response: %+v", res)
		}
	})

	t.Run("fails when contact fields are missing", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ORG-001",
			LegalName:        "Acme Corp",
			DisplayName:      "Acme",
			ContactEmail:     "",
			ContactPhone:     "",
			Country:          "",
			Address:          "",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %v", appErr)
		}
	})

	t.Run("fails when organization code already exists", func(t *testing.T) {
		repo := &mockOrgRepo{
			existingCode: &models.Organization{ID: "existing-id", Code: "ORG-001"},
		}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ORG-001",
			LegalName:        "Acme Corp",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon, Myanmar",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected duplicate code error, got %v", appErr)
		}
	})
}

func TestUpdateOrganization(t *testing.T) {
	org := &models.Organization{
		ID:           "org-1",
		Code:         "ORG-001",
		LegalName:    "Acme Corp",
		DisplayName:  "Acme",
		ContactEmail: "old@acme.com",
		ContactPhone: "+959111111",
		Country:      "MM",
		Address:      "Old Address",
		Status:       "ACTIVE",
	}

	t.Run("updates organization code and contact fields successfully", func(t *testing.T) {
		repo := &mockOrgRepo{org: org}
		svc := service.New(repo)

		newCode := "ORG-NEW"
		newEmail := "new@acme.com"
		res, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			OrganizationCode: &newCode,
			ContactEmail:     &newEmail,
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.OrganizationCode != "ORG-NEW" || res.ContactEmail != "new@acme.com" {
			t.Errorf("unexpected response: %+v", res)
		}
	})

	t.Run("rejects duplicate organization code on update", func(t *testing.T) {
		repo := &mockOrgRepo{
			org:          org,
			existingCode: &models.Organization{ID: "other-org", Code: "ORG-TAKEN"},
		}
		svc := service.New(repo)

		takenCode := "ORG-TAKEN"
		_, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			OrganizationCode: &takenCode,
		})

		if appErr == nil || appErr.Code != "CONFLICT" {
			t.Fatalf("expected CONFLICT, got %v", appErr)
		}
	})
}
