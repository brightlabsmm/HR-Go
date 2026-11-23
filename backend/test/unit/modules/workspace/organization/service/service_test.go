package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/organization/models"
	"hrgo/backend/internal/modules/workspace/organization/repository"
	"hrgo/backend/internal/modules/workspace/organization/request"
	"hrgo/backend/internal/modules/workspace/organization/service"
	"hrgo/backend/internal/shared/codeformat"
)

type mockWorkspaceOrgRepo struct {
	repository.Repository
	org           *models.Organization
	existingEmail *models.Organization
	settings      map[string]string
	err           error
}

func (m *mockWorkspaceOrgRepo) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.org, nil
}

func (m *mockWorkspaceOrgRepo) FindByContactEmail(ctx context.Context, email string) (*models.Organization, error) {
	if m.existingEmail != nil && m.existingEmail.ContactEmail != nil && strings.EqualFold(*m.existingEmail.ContactEmail, email) {
		return m.existingEmail, nil
	}
	if m.org != nil && m.org.ContactEmail != nil && strings.EqualFold(*m.org.ContactEmail, email) {
		return m.org, nil
	}
	return nil, nil
}

func (m *mockWorkspaceOrgRepo) Update(ctx context.Context, org *models.Organization) error {
	m.org = org
	return nil
}

func (m *mockWorkspaceOrgRepo) GetSettings(ctx context.Context, orgID string) (map[string]string, error) {
	if m.settings == nil {
		m.settings = make(map[string]string)
	}
	return m.settings, nil
}

func (m *mockWorkspaceOrgRepo) SaveSetting(ctx context.Context, orgID string, key, value string) error {
	if m.settings == nil {
		m.settings = make(map[string]string)
	}
	m.settings[key] = value
	return nil
}

func TestWorkspaceOrgSettings(t *testing.T) {
	email := "contact@acme.com"
	phone := "+123456789"
	country := "MM"
	address := "123 Business Rd"

	org := &models.Organization{
		ID:           "org-1",
		Code:         "ORG-001",
		LegalName:    "Acme Corp Ltd",
		DisplayName:  "Acme Corp",
		ContactEmail: &email,
		ContactPhone: &phone,
		Country:      &country,
		Address:      &address,
		Status:       "ACTIVE",
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	repo := &mockWorkspaceOrgRepo{
		org: org,
		settings: map[string]string{
			codeformat.SettingKeyBranchCodeFormat:     "BR-{0000}",
			codeformat.SettingKeyDepartmentCodeFormat: "DEPT-{0000}",
		},
	}
	svc := service.New(repo)

	t.Run("GetSettings returns organization and code format settings", func(t *testing.T) {
		res, err := svc.GetSettings(context.Background(), "org-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.OrganizationCode != "ORG-001" {
			t.Errorf("expected code ORG-001, got %s", res.OrganizationCode)
		}
		if res.DisplayName != "Acme Corp" {
			t.Errorf("expected display name Acme Corp, got %s", res.DisplayName)
		}
		if res.BranchCodeFormat != "BR-{0000}" {
			t.Errorf("expected branch format BR-{0000}, got %s", res.BranchCodeFormat)
		}
	})

	t.Run("UpdateSettings updates display name and contact info", func(t *testing.T) {
		newDisplayName := "Acme Global"
		newEmail := "info@acme.com"
		newBranchFormat := "BRANCH-{000}"

		res, err := svc.UpdateSettings(context.Background(), "org-1", request.UpdateOrganizationSettingsRequest{
			DisplayName:      &newDisplayName,
			ContactEmail:     &newEmail,
			BranchCodeFormat: &newBranchFormat,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.DisplayName != "Acme Global" {
			t.Errorf("expected display name Acme Global, got %s", res.DisplayName)
		}
		if res.ContactEmail != "info@acme.com" {
			t.Errorf("expected email info@acme.com, got %s", res.ContactEmail)
		}
		if res.BranchCodeFormat != "BRANCH-{000}" {
			t.Errorf("expected branch format BRANCH-{000}, got %s", res.BranchCodeFormat)
		}
	})

	t.Run("UpdateSettings rejects duplicate contact email from another organization", func(t *testing.T) {
		otherEmail := "taken@other.com"
		repoWithDup := &mockWorkspaceOrgRepo{
			org:           org,
			existingEmail: &models.Organization{ID: "org-2", ContactEmail: &otherEmail},
			settings:      repo.settings,
		}
		svcWithDup := service.New(repoWithDup)

		dupEmail := "TAKEN@other.com"
		_, appErr := svcWithDup.UpdateSettings(context.Background(), "org-1", request.UpdateOrganizationSettingsRequest{
			ContactEmail: &dupEmail,
		})
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "contactEmail" {
			t.Fatalf("expected VALIDATION_ERROR on contactEmail, got %+v", appErr)
		}
	})

	t.Run("UpdateSettings rejects invalid branch and department code formats", func(t *testing.T) {
		invalidFormat := "XYZ"
		_, appErr := svc.UpdateSettings(context.Background(), "org-1", request.UpdateOrganizationSettingsRequest{
			BranchCodeFormat: &invalidFormat,
		})
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "branchCodeFormat" {
			t.Fatalf("expected VALIDATION_ERROR on branchCodeFormat, got %+v", appErr)
		}

		_, appErr = svc.UpdateSettings(context.Background(), "org-1", request.UpdateOrganizationSettingsRequest{
			DepartmentCodeFormat: &invalidFormat,
		})
		if appErr == nil || appErr.Code != "VALIDATION_ERROR" || len(appErr.Details) == 0 || appErr.Details[0].Field != "departmentCodeFormat" {
			t.Fatalf("expected VALIDATION_ERROR on departmentCodeFormat, got %+v", appErr)
		}
	})

	t.Run("UpdateSettings allows keeping own contact email", func(t *testing.T) {
		sameEmail := "INFO@ACME.COM"
		res, appErr := svc.UpdateSettings(context.Background(), "org-1", request.UpdateOrganizationSettingsRequest{
			ContactEmail: &sameEmail,
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.ContactEmail != "INFO@ACME.COM" {
			t.Errorf("expected contact email INFO@ACME.COM, got %s", res.ContactEmail)
		}
	})
}
