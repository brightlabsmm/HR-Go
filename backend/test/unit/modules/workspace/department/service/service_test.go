package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/department/models"
	"hrgo/backend/internal/modules/workspace/department/repository"
	"hrgo/backend/internal/modules/workspace/department/request"
	"hrgo/backend/internal/modules/workspace/department/service"
)

type mockDeptRepo struct {
	repository.Repository
	dept *models.Department
	err  error
}

func (m *mockDeptRepo) Create(ctx context.Context, d *models.Department) error {
	if m.err != nil {
		return m.err
	}
	d.ID = "dept-1"
	d.Code = "001"
	d.CreatedAt = time.Now()
	d.UpdatedAt = time.Now()
	m.dept = d
	return nil
}

func (m *mockDeptRepo) FindByID(ctx context.Context, orgID, id string) (*models.Department, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.dept != nil && m.dept.ID == id {
		return m.dept, nil
	}
	return nil, nil
}

func (m *mockDeptRepo) Update(ctx context.Context, d *models.Department) error {
	if m.err != nil {
		return m.err
	}
	d.UpdatedAt = time.Now()
	m.dept = d
	return nil
}

func TestDepartment_NameLengthValidation(t *testing.T) {
	repo := &mockDeptRepo{}
	svc := service.New(repo)

	t.Run("rejects empty department name", func(t *testing.T) {
		_, err := svc.Create(context.Background(), "org-1", request.CreateDepartmentRequest{
			DepartmentName: "   ",
		})
		if err == nil || err.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for empty name, got %v", err)
		}
	})

	t.Run("rejects department name exceeding 150 characters", func(t *testing.T) {
		longName := strings.Repeat("A", 151)
		_, err := svc.Create(context.Background(), "org-1", request.CreateDepartmentRequest{
			DepartmentName: longName,
		})
		if err == nil || err.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for name > 150 chars, got %v", err)
		}
	})

	t.Run("accepts department name up to 150 characters", func(t *testing.T) {
		validName := strings.Repeat("A", 150)
		res, err := svc.Create(context.Background(), "org-1", request.CreateDepartmentRequest{
			DepartmentName: validName,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.DepartmentName != validName {
			t.Errorf("expected name %s, got %s", validName, res.DepartmentName)
		}
	})

	t.Run("rejects update with department name exceeding 150 characters", func(t *testing.T) {
		longName := strings.Repeat("B", 151)
		_, err := svc.Update(context.Background(), "org-1", "dept-1", request.UpdateDepartmentRequest{
			DepartmentName: &longName,
		})
		if err == nil || err.Code != "VALIDATION_ERROR" {
			t.Fatalf("expected VALIDATION_ERROR for update name > 150 chars, got %v", err)
		}
	})
}
