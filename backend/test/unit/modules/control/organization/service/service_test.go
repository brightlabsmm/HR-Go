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
	org *models.Organization
	err error
}

func (m *mockOrgRepo) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.org, nil
}

func (m *mockOrgRepo) Update(ctx context.Context, org *models.Organization) error {
	m.org = org
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
