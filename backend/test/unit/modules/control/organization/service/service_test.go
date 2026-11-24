package service_test

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/repository"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/service"
)

type mockOrgRepo struct {
	repository.Repository
	org           *models.Organization
	existingCode  *models.Organization
	existingEmail *models.Organization
	deletedID     string
	emp           *models.EmployeeIdentity
	acc           *models.OrganizationAccount
	adminDetails  []models.AdminAccountDetail
	err           error
}

func (m *mockOrgRepo) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.org, nil
}

func (m *mockOrgRepo) FindByCode(ctx context.Context, code string) (*models.Organization, error) {
	if m.existingCode != nil && strings.EqualFold(m.existingCode.Code, code) {
		return m.existingCode, nil
	}
	if m.org != nil && strings.EqualFold(m.org.Code, code) {
		return m.org, nil
	}
	return nil, nil
}

func (m *mockOrgRepo) FindByContactEmail(ctx context.Context, email string) (*models.Organization, error) {
	if m.existingEmail != nil && strings.EqualFold(m.existingEmail.ContactEmail, email) {
		return m.existingEmail, nil
	}
	if m.org != nil && strings.EqualFold(m.org.ContactEmail, email) {
		return m.org, nil
	}
	return nil, nil
}

func (m *mockOrgRepo) Create(ctx context.Context, org *models.Organization) error {
	if m.err != nil {
		return m.err
	}
	org.ID = "org-created"
	m.org = org
	return nil
}

func (m *mockOrgRepo) Update(ctx context.Context, org *models.Organization) error {
	m.org = org
	return nil
}

func (m *mockOrgRepo) SoftDelete(ctx context.Context, id string) error {
	m.deletedID = id
	m.org = nil
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

func (m *mockOrgRepo) ListAdminAccounts(ctx context.Context, orgID string, q request.ListAdminAccountsQuery) ([]models.AdminAccountDetail, error) {
	return m.adminDetails, nil
}

func (m *mockOrgRepo) SuspendAndRevokeSessions(ctx context.Context, orgID string, reason string, now time.Time) error {
	if m.err != nil {
		return m.err
	}
	if m.org != nil {
		m.org.Status = "SUSPENDED"
		m.org.SuspendedAt = &now
		m.org.SessionsRevokedAt = &now
		if reason != "" {
			m.org.SuspendReason = &reason
		}
	}
	return nil
}

func (m *mockOrgRepo) SuspendDueOrganizations(ctx context.Context, now time.Time) ([]string, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.org != nil && m.org.Status == "ACTIVE" && m.org.ScheduledSuspendAt != nil && !m.org.ScheduledSuspendAt.After(now) {
		m.org.Status = "SUSPENDED"
		m.org.SuspendedAt = &now
		m.org.SessionsRevokedAt = &now
		return []string{m.org.ID}, nil
	}
	return nil, nil
}

func (m *mockOrgRepo) ClearSuspendSchedule(ctx context.Context, orgID string) error {
	if m.err != nil {
		return m.err
	}
	if m.org != nil {
		m.org.ScheduledSuspendAt = nil
		m.org.SuspendNotifyFrom = nil
		m.org.SuspendNotifyTo = nil
		m.org.SuspendReason = nil
	}
	return nil
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
		// ACTIVE -> allowed: SUSPENDED
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
			name:          "ACTIVE to ARCHIVED rejected with 409 Conflict",
			initialStatus: "ACTIVE",
			targetStatus:  "ARCHIVED",
			confirmation:  true,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		{
			name:          "ACTIVE to PENDING rejected with 409 Conflict",
			initialStatus: "ACTIVE",
			targetStatus:  "PENDING",
			confirmation:  false,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		// SUSPENDED -> allowed: ACTIVE
		{
			name:          "SUSPENDED to ACTIVE (Reactivate) succeeds",
			initialStatus: "SUSPENDED",
			targetStatus:  "ACTIVE",
			confirmation:  false,
		},
		{
			name:          "SUSPENDED to ARCHIVED rejected with 409 Conflict",
			initialStatus: "SUSPENDED",
			targetStatus:  "ARCHIVED",
			confirmation:  true,
			expectErrCode: "CONFLICT",
			expectStatus:  http.StatusConflict,
		},
		{
			name:          "SUSPENDED to PENDING rejected with 409 Conflict",
			initialStatus: "SUSPENDED",
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
		{
			name:          "PENDING to ACTIVE without active admin rejected with 400 Bad Request",
			initialStatus: "PENDING",
			targetStatus:  "ACTIVE",
			confirmation:  false,
			expectErrCode: "BAD_REQUEST",
			expectStatus:  http.StatusBadRequest,
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
			if tt.targetStatus == "ACTIVE" && tt.expectErrCode == "" {
				repo.adminDetails = []models.AdminAccountDetail{
					{AccountID: "acc-1", RoleCode: "ORG_ADMIN", Status: "ACTIVE"},
				}
			}
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

	t.Run("rejects weak password with only digits or common words", func(t *testing.T) {
		repo := &mockOrgRepo{org: org}
		svc := service.New(repo)

		for _, weakPw := range []string{"12345678", "password", "Admin123", "Short1"} {
			_, appErr := svc.CreateAdminAccount(context.Background(), "org-1", request.CreateAdminAccountRequest{
				FirstName:    "John",
				LastName:     "Doe",
				EmployeeCode: "EMP-NEW",
				Password:     weakPw,
			})

			if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
				t.Errorf("expected VALIDATION_ERROR for weak password %q, got %v", weakPw, appErr)
			}
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

	t.Run("fails when contact email already exists case-insensitively", func(t *testing.T) {
		repo := &mockOrgRepo{
			existingEmail: &models.Organization{ID: "existing-id", Code: "ORG-999", ContactEmail: "Contact@Acme.com"},
		}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ORG-002",
			LegalName:        "Acme Two Corp",
			DisplayName:      "Acme Two",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon, Myanmar",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "contactEmail" {
			t.Fatalf("expected VALIDATION_ERROR on contactEmail, got %+v", appErr)
		}
	})
}

func TestUpdateOrganization(t *testing.T) {
	newTestOrg := func() *models.Organization {
		return &models.Organization{
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
	}

	t.Run("updates contact fields successfully while keeping organization code", func(t *testing.T) {
		repo := &mockOrgRepo{org: newTestOrg()}
		svc := service.New(repo)

		newEmail := "new@acme.com"
		res, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			ContactEmail: &newEmail,
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.OrganizationCode != "ORG-001" || res.ContactEmail != "new@acme.com" {
			t.Errorf("unexpected response: %+v", res)
		}
	})

	t.Run("allows updating while keeping own contact email with different casing", func(t *testing.T) {
		repo := &mockOrgRepo{org: newTestOrg()}
		svc := service.New(repo)

		sameEmailDifferentCase := "OLD@ACME.COM"
		res, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			ContactEmail: &sameEmailDifferentCase,
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.ContactEmail != "OLD@ACME.COM" {
			t.Errorf("expected contact email OLD@ACME.COM, got %s", res.ContactEmail)
		}
	})

	t.Run("rejects duplicate contact email belonging to another organization", func(t *testing.T) {
		repo := &mockOrgRepo{
			org:           newTestOrg(),
			existingEmail: &models.Organization{ID: "other-org", ContactEmail: "taken@acme.com"},
		}
		svc := service.New(repo)

		takenEmail := "TAKEN@ACME.COM"
		_, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			ContactEmail: &takenEmail,
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "contactEmail" {
			t.Fatalf("expected VALIDATION_ERROR on contactEmail, got %+v", appErr)
		}
	})

	t.Run("rejects changing organization code on update (OBS-02)", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: newTestOrg(),
		}
		svc := service.New(repo)

		newCode := "ORG-CHANGED"
		_, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			OrganizationCode: &newCode,
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "organizationCode" {
			t.Fatalf("expected VALIDATION_ERROR on organizationCode, got %+v", appErr)
		}
	})

	t.Run("allows submitting same organization code on update", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: newTestOrg(),
		}
		svc := service.New(repo)

		sameCode := repo.org.Code
		res, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			OrganizationCode: &sameCode,
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.OrganizationCode != repo.org.Code {
			t.Errorf("expected code %s, got %s", repo.org.Code, res.OrganizationCode)
		}
	})
}

func TestDeleteOrganization(t *testing.T) {
	t.Run("soft deletes existing organization", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{ID: "org-1", Code: "ORG-001", Status: "ACTIVE"},
		}
		svc := service.New(repo)

		appErr := svc.Delete(context.Background(), "org-1")
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if repo.deletedID != "org-1" {
			t.Errorf("expected deletedID org-1, got %s", repo.deletedID)
		}
	})

	t.Run("returns 404 when organization does not exist", func(t *testing.T) {
		repo := &mockOrgRepo{org: nil}
		svc := service.New(repo)

		appErr := svc.Delete(context.Background(), "missing-id")
		if appErr == nil || appErr.Status != http.StatusNotFound {
			t.Fatalf("expected 404 NotFound, got %+v", appErr)
		}
	})
}

func TestOrganizationValidation(t *testing.T) {
	t.Run("rejects invalid phone and country (BUG-01, BUG-02, BUG-03)", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "abcdefg!!!",
			Country:          "Myanmar123!@#",
			Address:          "Yangon, Myanmar",
		})

		if appErr == nil {
			t.Fatal("expected validation error, got nil")
		}
		if appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR, got %s", appErr.Code)
		}

		fieldErrors := make(map[string]string)
		for _, issue := range appErr.Details {
			fieldErrors[issue.Field] = issue.Message
		}

		if _, ok := fieldErrors["contactPhone"]; !ok {
			t.Errorf("expected field error on contactPhone, got details: %+v", appErr.Details)
		}
		if _, ok := fieldErrors["country"]; !ok {
			t.Errorf("expected field error on country, got details: %+v", appErr.Details)
		}
	})

	t.Run("rejects free-text country not in allowed list (BUG-02)", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "Myanmar12",
			Address:          "Yangon",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR on country, got %+v", appErr)
		}

		hasCountryError := false
		for _, issue := range appErr.Details {
			if issue.Field == "country" {
				hasCountryError = true
				break
			}
		}
		if !hasCountryError {
			t.Errorf("expected field error on country, got details: %+v", appErr.Details)
		}
	})

	t.Run("normalizes valid lowercase country to uppercase ISO code", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		res, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "th",
			Address:          "Bangkok",
		})

		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.Country != "TH" {
			t.Errorf("expected country TH, got %s", res.Country)
		}
	})

	t.Run("maps DB country check constraint to validation error", func(t *testing.T) {
		repo := &mockOrgRepo{
			err: fmt.Errorf("pq: new row for relation \"organizations\" violates check constraint \"chk_organizations_country\""),
		}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon",
		})

		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected 400 VALIDATION_ERROR, got %+v", appErr)
		}
	})

	t.Run("maps DB string length truncation to validation error not 500", func(t *testing.T) {
		repo := &mockOrgRepo{
			err: fmt.Errorf("pq: value too long for type character varying(10)"),
		}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon",
		})

		if appErr == nil {
			t.Fatal("expected error, got nil")
		}
		if appErr.Status != http.StatusBadRequest || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected 400 VALIDATION_ERROR, got %+v", appErr)
		}
	})

	t.Run("rejects 300-character display name with validation error (BUG-33)", func(t *testing.T) {
		repo := &mockOrgRepo{}
		svc := service.New(repo)

		longDisplayName := strings.Repeat("A", 300)
		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      longDisplayName,
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon",
		})

		if appErr == nil {
			t.Fatal("expected validation error for 300-char display name, got nil")
		}
		if appErr.Status != http.StatusBadRequest || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected 400 VALIDATION_ERROR, got %+v", appErr)
		}

		found := false
		for _, issue := range appErr.Details {
			if issue.Field == "displayName" {
				found = true
				if issue.Message != "Display name must not exceed 255 characters." {
					t.Errorf("unexpected message: %s", issue.Message)
				}
				break
			}
		}
		if !found {
			t.Fatalf("expected field issue for displayName, got %+v", appErr.Details)
		}
	})

	t.Run("rejects 300-character display name on update (BUG-33)", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{ID: "org-1", Code: "ORG-001", Status: "ACTIVE"},
		}
		svc := service.New(repo)

		longDisplayName := strings.Repeat("A", 300)
		_, appErr := svc.Update(context.Background(), "org-1", request.UpdateOrganizationRequest{
			DisplayName: &longDisplayName,
		})

		if appErr == nil {
			t.Fatal("expected validation error for 300-char display name, got nil")
		}
		if appErr.Status != http.StatusBadRequest || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected 400 VALIDATION_ERROR, got %+v", appErr)
		}

		found := false
		for _, issue := range appErr.Details {
			if issue.Field == "displayName" {
				found = true
				if issue.Message != "Display name must not exceed 255 characters." {
					t.Errorf("unexpected message: %s", issue.Message)
				}
				break
			}
		}
		if !found {
			t.Fatalf("expected field issue for displayName, got %+v", appErr.Details)
		}
	})

	t.Run("maps DB 255-character truncation to displayName field error (BUG-33)", func(t *testing.T) {
		repo := &mockOrgRepo{
			err: fmt.Errorf("pq: value too long for type character varying(255)"),
		}
		svc := service.New(repo)

		_, appErr := svc.Create(context.Background(), request.CreateOrganizationRequest{
			OrganizationCode: "ACME-CORP",
			LegalName:        "Acme Corporation",
			DisplayName:      "Acme",
			ContactEmail:     "contact@acme.com",
			ContactPhone:     "+95912345678",
			Country:          "MM",
			Address:          "Yangon",
		})

		if appErr == nil {
			t.Fatal("expected error, got nil")
		}
		if appErr.Status != http.StatusBadRequest || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected 400 VALIDATION_ERROR, got %+v", appErr)
		}
		found := false
		for _, issue := range appErr.Details {
			if issue.Field == "displayName" {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected field issue for displayName, got %+v", appErr.Details)
		}
	})
}

type mockFailingCreateRepo struct {
	repository.Repository
	err error
}

func (m mockFailingCreateRepo) FindByCode(ctx context.Context, code string) (*models.Organization, error) {
	return nil, nil
}
func (m mockFailingCreateRepo) FindByContactEmail(ctx context.Context, email string) (*models.Organization, error) {
	return nil, nil
}
func (m mockFailingCreateRepo) Create(ctx context.Context, org *models.Organization) error {
	return m.err
}

func TestOrganizationSuspensionScheduleAndSessions(t *testing.T) {
	now := time.Now().UTC()
	future := now.Add(24 * time.Hour)
	past := now.Add(-1 * time.Hour)

	t.Run("immediate suspension revokes sessions and updates status", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:     "org-1",
				Code:   "ORG-1",
				Status: "ACTIVE",
			},
		}
		svc := service.New(repo)
		imm := true
		res, appErr := svc.UpdateStatus(context.Background(), "org-1", request.UpdateStatusRequest{
			Status:       "SUSPENDED",
			Confirmation: true,
			Immediate:    &imm,
			Reason:       "Non-payment",
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %+v", appErr)
		}
		if res.Status != "SUSPENDED" {
			t.Errorf("status = %s, want SUSPENDED", res.Status)
		}
		if repo.org.SessionsRevokedAt == nil {
			t.Error("sessionsRevokedAt should not be nil")
		}
	})

	t.Run("scheduled suspension validates future suspend date", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:     "org-1",
				Code:   "ORG-1",
				Status: "ACTIVE",
			},
		}
		svc := service.New(repo)
		imm := false
		_, appErr := svc.UpdateStatus(context.Background(), "org-1", request.UpdateStatusRequest{
			Status:       "SUSPENDED",
			Confirmation: true,
			Immediate:    &imm,
			SuspendAt:    &past,
		})
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for past suspend date, got %+v", appErr)
		}
	})

	t.Run("scheduled suspension validates notify window order", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:     "org-1",
				Code:   "ORG-1",
				Status: "ACTIVE",
			},
		}
		svc := service.New(repo)
		imm := false
		notifyFrom := future.Add(2 * time.Hour)
		notifyTo := future.Add(1 * time.Hour)
		_, appErr := svc.UpdateStatus(context.Background(), "org-1", request.UpdateStatusRequest{
			Status:       "SUSPENDED",
			Confirmation: true,
			Immediate:    &imm,
			NotifyFrom:   &notifyFrom,
			NotifyTo:     &notifyTo,
			SuspendAt:    &future,
		})
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for notifyFrom > notifyTo, got %+v", appErr)
		}
	})

	t.Run("scheduled suspension succeeds and leaves org ACTIVE until scheduled date", func(t *testing.T) {
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:     "org-1",
				Code:   "ORG-1",
				Status: "ACTIVE",
			},
		}
		svc := service.New(repo)
		imm := false
		notifyFrom := now.Add(1 * time.Hour)
		notifyTo := now.Add(12 * time.Hour)
		reason := "Maintenance renewal"
		res, appErr := svc.UpdateStatus(context.Background(), "org-1", request.UpdateStatusRequest{
			Status:       "SUSPENDED",
			Confirmation: true,
			Immediate:    &imm,
			NotifyFrom:   &notifyFrom,
			NotifyTo:     &notifyTo,
			SuspendAt:    &future,
			Reason:       reason,
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %+v", appErr)
		}
		if res.Status != "ACTIVE" {
			t.Errorf("status = %s, want ACTIVE during schedule", res.Status)
		}
		if repo.org.ScheduledSuspendAt == nil {
			t.Fatal("scheduledSuspendAt should not be nil")
		}
		if repo.org.SuspendReason == nil || *repo.org.SuspendReason != reason {
			t.Errorf("suspendReason = %v, want %s", repo.org.SuspendReason, reason)
		}
	})

	t.Run("cancel suspend schedule clears schedule fields", func(t *testing.T) {
		schedAt := future
		reason := "Maintenance"
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:                 "org-1",
				Code:               "ORG-1",
				Status:             "ACTIVE",
				ScheduledSuspendAt: &schedAt,
				SuspendReason:      &reason,
			},
		}
		svc := service.New(repo)
		res, appErr := svc.CancelSuspendSchedule(context.Background(), "org-1")
		if appErr != nil {
			t.Fatalf("unexpected error: %+v", appErr)
		}
		if res.ScheduledSuspendAt != nil {
			t.Error("scheduledSuspendAt should be nil after cancel")
		}
	})

	t.Run("process due suspensions marks due organizations as suspended", func(t *testing.T) {
		schedAt := now.Add(-5 * time.Minute)
		repo := &mockOrgRepo{
			org: &models.Organization{
				ID:                 "org-due",
				Code:               "ORG-DUE",
				Status:             "ACTIVE",
				ScheduledSuspendAt: &schedAt,
			},
		}
		svc := service.New(repo)
		ids, err := svc.ProcessDueSuspensions(context.Background())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(ids) != 1 || ids[0] != "org-due" {
			t.Fatalf("expected [org-due], got %v", ids)
		}
		if repo.org.Status != "SUSPENDED" {
			t.Errorf("status = %s, want SUSPENDED", repo.org.Status)
		}
	})
}
