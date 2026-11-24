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
	for i := range m.branches {
		if m.branches[i].ID == id {
			return &m.branches[i], nil
		}
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
	for i := range m.branches {
		if m.branches[i].Code == code {
			return &m.branches[i], nil
		}
	}
	return nil, nil
}

func (m *mockBranchRepo) Update(ctx context.Context, b *models.Branch) error {
	if m.err != nil {
		return m.err
	}
	b.UpdatedAt = time.Date(2026, 11, 23, 12, 0, 0, 0, time.UTC)
	m.branch = b
	for i := range m.branches {
		if m.branches[i].ID == b.ID {
			m.branches[i] = *b
		}
	}
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

func TestBranchService_CircularParentPrevention(t *testing.T) {
	hqID := "hq-1"
	childID := "child-1"
	grandChildID := "gc-1"

	repo := &mockBranchRepo{
		branches: []models.Branch{
			{ID: hqID, OrganizationID: "org-1", Code: "HQ", Name: "HQ Branch", ParentID: nil},
			{ID: childID, OrganizationID: "org-1", Code: "CHILD", Name: "Child Branch", ParentID: &hqID},
			{ID: grandChildID, OrganizationID: "org-1", Code: "GC", Name: "GrandChild Branch", ParentID: &childID},
		},
	}
	svc := service.New(repo)

	t.Run("rejects self as parent", func(t *testing.T) {
		_, appErr := svc.Update(context.Background(), "org-1", hqID, request.UpdateBranchRequest{
			ParentID: &hqID,
		})
		if appErr == nil || appErr.Status != 400 {
			t.Fatalf("expected 400 error for self parent, got %v", appErr)
		}
	})

	t.Run("rejects direct child as parent (creates 2-node cycle)", func(t *testing.T) {
		_, appErr := svc.Update(context.Background(), "org-1", hqID, request.UpdateBranchRequest{
			ParentID: &childID,
		})
		if appErr == nil || appErr.Status != 400 {
			t.Fatalf("expected 400 error for child as parent, got %v", appErr)
		}
	})

	t.Run("rejects grandchild as parent (creates 3-node cycle)", func(t *testing.T) {
		_, appErr := svc.Update(context.Background(), "org-1", hqID, request.UpdateBranchRequest{
			ParentID: &grandChildID,
		})
		if appErr == nil || appErr.Status != 400 {
			t.Fatalf("expected 400 error for grandchild as parent, got %v", appErr)
		}
	})

	t.Run("allows valid non-circular parent", func(t *testing.T) {
		otherID := "other-1"
		repo.branches = append(repo.branches, models.Branch{
			ID: otherID, OrganizationID: "org-1", Code: "OTHER", Name: "Other Root", ParentID: nil,
		})

		res, appErr := svc.Update(context.Background(), "org-1", hqID, request.UpdateBranchRequest{
			ParentID: &otherID,
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if res.ParentID == nil || *res.ParentID != otherID {
			t.Errorf("expected parent %s, got %v", otherID, res.ParentID)
		}
	})
}
