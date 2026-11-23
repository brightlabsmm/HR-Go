package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/branch/models"
	"hrgo/backend/internal/modules/workspace/branch/repository"
	"hrgo/backend/internal/modules/workspace/branch/request"
	"hrgo/backend/internal/modules/workspace/branch/service"
)

type mockBranchRepo struct {
	repository.Repository
	branch   *models.Branch
	branches []models.Branch
	err      error
}

func (m *mockBranchRepo) Create(ctx context.Context, b *models.Branch) error {
	if m.err != nil {
		return m.err
	}
	b.ID = "branch-1"
	b.CreatedAt = time.Date(2026, 11, 23, 10, 0, 0, 0, time.UTC)
	b.UpdatedAt = time.Date(2026, 11, 23, 10, 0, 0, 0, time.UTC)
	m.branch = b
	return nil
}

func (m *mockBranchRepo) FindByID(ctx context.Context, orgID, id string) (*models.Branch, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.branch != nil && m.branch.ID == id {
		return m.branch, nil
	}
	return nil, nil
}

func (m *mockBranchRepo) FindByCode(ctx context.Context, orgID, code string) (*models.Branch, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.branch != nil && m.branch.Code == code {
		return m.branch, nil
	}
	return nil, nil
}

func (m *mockBranchRepo) Update(ctx context.Context, b *models.Branch) error {
	if m.err != nil {
		return m.err
	}
	b.UpdatedAt = time.Date(2026, 11, 23, 12, 0, 0, 0, time.UTC)
	m.branch = b
	return nil
}

func (m *mockBranchRepo) List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]models.Branch, int64, error) {
	if m.err != nil {
		return nil, 0, m.err
	}
	return m.branches, int64(len(m.branches)), nil
}

func TestBranchService_CreatedAtAndUpdatedAt(t *testing.T) {
	createdAt := time.Date(2026, 11, 23, 8, 30, 0, 0, time.UTC)
	updatedAt := time.Date(2026, 11, 23, 9, 45, 0, 0, time.UTC)

	repo := &mockBranchRepo{
		branch: &models.Branch{
			ID:             "b-123",
			OrganizationID: "org-1",
			Code:           "BR-001",
			Name:           "Yangon Head Branch",
			Address:        "Yangon, Myanmar",
			Status:         "ACTIVE",
			CreatedAt:      createdAt,
			UpdatedAt:      updatedAt,
		},
	}
	svc := service.New(repo)

	t.Run("GetByID returns CreatedAt and UpdatedAt (BUG-09)", func(t *testing.T) {
		res, appErr := svc.GetByID(context.Background(), "org-1", "b-123")
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res == nil {
			t.Fatal("expected response, got nil")
		}
		if res.CreatedAt.IsZero() {
			t.Errorf("expected non-zero CreatedAt, got zero")
		}
		if !res.CreatedAt.Equal(createdAt) {
			t.Errorf("expected CreatedAt %v, got %v", createdAt, res.CreatedAt)
		}
		if res.UpdatedAt.IsZero() {
			t.Errorf("expected non-zero UpdatedAt, got zero")
		}
		if !res.UpdatedAt.Equal(updatedAt) {
			t.Errorf("expected UpdatedAt %v, got %v", updatedAt, res.UpdatedAt)
		}
	})

	t.Run("Create returns non-zero CreatedAt and UpdatedAt", func(t *testing.T) {
		res, appErr := svc.Create(context.Background(), "org-1", request.CreateBranchRequest{
			BranchName: "New Branch",
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.CreatedAt.IsZero() {
			t.Errorf("expected non-zero CreatedAt, got zero")
		}
		if res.UpdatedAt.IsZero() {
			t.Errorf("expected non-zero UpdatedAt, got zero")
		}
	})

	t.Run("List returns CreatedAt and UpdatedAt for items", func(t *testing.T) {
		repo.branches = []models.Branch{
			{
				ID:             "b-1",
				OrganizationID: "org-1",
				Code:           "BR-001",
				Name:           "Branch 1",
				Status:         "ACTIVE",
				CreatedAt:      createdAt,
				UpdatedAt:      updatedAt,
			},
		}

		items, _, _, total, appErr := svc.List(context.Background(), "org-1", request.ListBranchesQuery{})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if total != 1 || len(items) != 1 {
			t.Fatalf("expected 1 item, got %d", len(items))
		}
		if items[0].CreatedAt.IsZero() || items[0].UpdatedAt.IsZero() {
			t.Errorf("expected non-zero timestamps in list item")
		}
	})
}
