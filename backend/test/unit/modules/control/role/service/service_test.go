package service_test

import (
	"context"
	"testing"

	"hrgo/backend/internal/modules/control/role/models"
	"hrgo/backend/internal/modules/control/role/repository"
	"hrgo/backend/internal/modules/control/role/request"
	"hrgo/backend/internal/modules/control/role/service"
)

type mockRoleRepo struct {
	repository.Repository
	roles []models.PlatformRole
	perms []models.Permission
	total int64
	err   error
}

func (m *mockRoleRepo) ListRoles(ctx context.Context) ([]models.PlatformRole, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.roles, nil
}

func (m *mockRoleRepo) ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]models.Permission, int64, error) {
	if m.err != nil {
		return nil, 0, m.err
	}
	return m.perms, m.total, nil
}

func (m *mockRoleRepo) ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) (*models.PlatformRole, error) {
	if m.err != nil {
		return nil, m.err
	}
	role := models.PlatformRole{
		ID:          roleID,
		Code:        "TEST_ROLE",
		Name:        "Test Role",
		Permissions: m.perms,
	}
	return &role, nil
}

func TestRoleService(t *testing.T) {
	t.Run("ListPermissions returns permissions with grouping", func(t *testing.T) {
		repo := &mockRoleRepo{
			perms: []models.Permission{
				{
					ID:       "p1",
					Code:     "platform.user.read",
					Scope:    "PLATFORM",
					Grouping: "user",
					Resource: "platform_user",
					Action:   "read",
				},
				{
					ID:       "p2",
					Code:     "platform.role.read",
					Scope:    "PLATFORM",
					Grouping: "role",
					Resource: "platform_role",
					Action:   "read",
				},
			},
			total: 2,
		}
		svc := service.New(repo)

		res, page, pageSize, total, appErr := svc.ListPermissions(context.Background(), request.ListPermissionsQuery{
			Scope: "PLATFORM",
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if total != 2 || page != 1 || pageSize != 50 {
			t.Errorf("unexpected pagination: page=%d, size=%d, total=%d", page, pageSize, total)
		}
		if len(res) != 2 {
			t.Fatalf("expected 2 items, got %d", len(res))
		}
		if res[0].Grouping != "user" || res[1].Grouping != "role" {
			t.Errorf("unexpected groupings: %s, %s", res[0].Grouping, res[1].Grouping)
		}
	})

	t.Run("ListRoles maps role permissions with grouping", func(t *testing.T) {
		repo := &mockRoleRepo{
			roles: []models.PlatformRole{
				{
					ID:   "r1",
					Code: "SUPERADMIN",
					Name: "Superadmin",
					Permissions: []models.Permission{
						{
							ID:       "p1",
							Code:     "platform.organization.create",
							Scope:    "PLATFORM",
							Grouping: "organization",
							Resource: "organization",
							Action:   "create",
						},
					},
				},
			},
		}
		svc := service.New(repo)

		roles, appErr := svc.ListRoles(context.Background())
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if len(roles) != 1 {
			t.Fatalf("expected 1 role, got %d", len(roles))
		}
		if len(roles[0].Permissions) != 1 {
			t.Fatalf("expected 1 permission, got %d", len(roles[0].Permissions))
		}
		if roles[0].Permissions[0].Grouping != "organization" {
			t.Errorf("expected grouping organization, got %s", roles[0].Permissions[0].Grouping)
		}
	})

	t.Run("UpdateRolePermissions updates and returns role", func(t *testing.T) {
		repo := &mockRoleRepo{
			perms: []models.Permission{
				{
					ID:       "p1",
					Code:     "platform.user.create",
					Scope:    "PLATFORM",
					Grouping: "user",
					Resource: "platform_user",
					Action:   "create",
				},
			},
		}
		svc := service.New(repo)

		role, appErr := svc.UpdateRolePermissions(context.Background(), "r1", request.ReplaceRolePermissionsRequest{
			PermissionIDs: []string{"p1"},
		})
		if appErr != nil {
			t.Fatalf("unexpected error: %v", appErr)
		}
		if role.ID != "r1" {
			t.Errorf("expected role ID r1, got %s", role.ID)
		}
		if len(role.Permissions) != 1 {
			t.Fatalf("expected 1 permission, got %d", len(role.Permissions))
		}
		if role.Permissions[0].Grouping != "user" {
			t.Errorf("expected grouping user, got %s", role.Permissions[0].Grouping)
		}
	})
}
