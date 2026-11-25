package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/auditlog/models"
	"hrgo/backend/internal/modules/workspace/auditlog/request"
	"hrgo/backend/internal/modules/workspace/auditlog/service"
)

type fakeAuditRepo struct {
	items []models.AuditLog
}

func (f *fakeAuditRepo) List(_ context.Context, _ string, _ request.ListAuditLogsQuery) ([]models.AuditLog, int64, error) {
	return f.items, int64(len(f.items)), nil
}

func TestAuditLogList(t *testing.T) {
	org := "org-1"
	repo := &fakeAuditRepo{
		items: []models.AuditLog{{
			ID:             "audit-1",
			OrganizationID: &org,
			ActorType:      "WORKSPACE",
			Action:         "CREATE_CONTRACT",
			EntityName:     "employment_contracts",
			CreatedAt:      time.Now().UTC(),
		}},
	}
	svc := service.New(repo)
	res, total, err := svc.List(context.Background(), "org-1", request.ListAuditLogsQuery{Page: 1, PageSize: 20})
	if err != nil {
		t.Fatalf("unexpected error: %+v", err)
	}
	if total != 1 || len(res) != 1 || res[0].Action != "CREATE_CONTRACT" {
		t.Fatalf("unexpected result: total=%d res=%+v", total, res)
	}
}
