package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"hrgo/backend/internal/modules/control/user/models"
	"hrgo/backend/internal/modules/control/user/repository"
	"hrgo/backend/internal/modules/control/user/request"
	"hrgo/backend/internal/modules/control/user/service"
)

type mockUserRepo struct {
	repository.Repository
	users []models.PlatformUser
	err   error
}

func (m *mockUserRepo) List(ctx context.Context, q request.ListUsersQuery) ([]models.PlatformUser, int64, error) {
	if m.err != nil {
		return nil, 0, m.err
	}

	var filtered []models.PlatformUser
	for _, u := range m.users {
		if q.Status != "" && !strings.EqualFold(u.Status, q.Status) {
			continue
		}
		if q.Q != "" {
			term := strings.ToLower(q.Q)
			if !strings.Contains(strings.ToLower(u.FullName), term) && !strings.Contains(strings.ToLower(u.Email), term) {
				continue
			}
		}
		filtered = append(filtered, u)
	}

	return filtered, int64(len(filtered)), nil
}

func TestListUsersStatusFilter(t *testing.T) {
	users := []models.PlatformUser{
		{ID: "1", FullName: "Alice Admin", Email: "alice@platform.local", Status: "ACTIVE", CreatedAt: time.Now()},
		{ID: "2", FullName: "Bob Inactive", Email: "bob@platform.local", Status: "INACTIVE", CreatedAt: time.Now()},
		{ID: "3", FullName: "Charlie Active", Email: "charlie@platform.local", Status: "ACTIVE", CreatedAt: time.Now()},
	}

	repo := &mockUserRepo{users: users}
	svc := service.New(repo)

	t.Run("filters by status ACTIVE", func(t *testing.T) {
		items, _, _, total, err := svc.List(context.Background(), request.ListUsersQuery{
			Status: "ACTIVE",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if total != 2 {
			t.Errorf("expected 2 active users, got %d", total)
		}
		for _, item := range items {
			if item.Status != "ACTIVE" {
				t.Errorf("expected ACTIVE status, got %s", item.Status)
			}
		}
	})

	t.Run("filters by status INACTIVE", func(t *testing.T) {
		items, _, _, total, err := svc.List(context.Background(), request.ListUsersQuery{
			Status: "INACTIVE",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if total != 1 {
			t.Errorf("expected 1 inactive user, got %d", total)
		}
		if items[0].Status != "INACTIVE" {
			t.Errorf("expected INACTIVE status, got %s", items[0].Status)
		}
	})
}
