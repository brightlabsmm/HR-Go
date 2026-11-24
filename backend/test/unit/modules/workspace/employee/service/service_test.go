package service_test

import (
	"context"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/employee/models"
	"hrgo/backend/internal/modules/workspace/employee/repository"
	"hrgo/backend/internal/modules/workspace/employee/request"
	"hrgo/backend/internal/modules/workspace/employee/service"
)

type mockEmployeeRepo struct {
	repository.Repository
	employees []models.Employee
	profiles  map[string]models.EmployeeProfile
	err       error
}

func (m *mockEmployeeRepo) Create(ctx context.Context, emp *models.Employee, prof *models.EmployeeProfile) error {
	if m.err != nil {
		return m.err
	}
	emp.ID = "emp-1"
	emp.CreatedAt = time.Now().UTC()
	emp.UpdatedAt = time.Now().UTC()
	m.employees = append(m.employees, *emp)
	if prof != nil {
		if m.profiles == nil {
			m.profiles = make(map[string]models.EmployeeProfile)
		}
		prof.ID = "prof-1"
		prof.EmployeeID = emp.ID
		m.profiles[emp.ID] = *prof
	}
	return nil
}

func (m *mockEmployeeRepo) FindByID(ctx context.Context, orgID, id string) (*models.Employee, error) {
	if m.err != nil {
		return nil, m.err
	}
	for i := range m.employees {
		if m.employees[i].ID == id {
			return &m.employees[i], nil
		}
	}
	return nil, nil
}

func (m *mockEmployeeRepo) FindByCode(ctx context.Context, orgID, code string) (*models.Employee, error) {
	for i := range m.employees {
		if m.employees[i].EmployeeCode == code {
			return &m.employees[i], nil
		}
	}
	return nil, nil
}

func (m *mockEmployeeRepo) FindByEmail(ctx context.Context, orgID, email string) (*models.Employee, error) {
	for i := range m.employees {
		if m.employees[i].Email != nil && *m.employees[i].Email == email {
			return &m.employees[i], nil
		}
	}
	return nil, nil
}

func (m *mockEmployeeRepo) List(ctx context.Context, orgID string, q request.ListEmployeesQuery) ([]models.Employee, int64, error) {
	return m.employees, int64(len(m.employees)), nil
}

func (m *mockEmployeeRepo) Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile) error {
	return nil
}

func (m *mockEmployeeRepo) SoftDelete(ctx context.Context, orgID, id string) error {
	return nil
}

func TestEmployeeService_CreateAndList(t *testing.T) {
	repo := &mockEmployeeRepo{}
	svc := service.New(repo)
	ctx := context.Background()

	email := "john.doe@example.com"
	req := request.CreateEmployeeRequest{
		EmployeeCode: "EMP001",
		FirstName:    "John",
		LastName:     "Doe",
		Email:        &email,
	}

	res, err := svc.Create(ctx, "org-1", req)
	if err != nil {
		t.Fatalf("unexpected error creating employee: %v", err)
	}
	if res.EmployeeCode != "EMP001" {
		t.Errorf("expected EMP001, got %s", res.EmployeeCode)
	}

	// Conflict check on duplicate code
	_, err = svc.Create(ctx, "org-1", req)
	if err == nil {
		t.Fatalf("expected error on duplicate employee code, got nil")
	}

	// List check
	list, err := svc.List(ctx, "org-1", request.ListEmployeesQuery{})
	if err != nil {
		t.Fatalf("unexpected error listing employees: %v", err)
	}
	if list.Pagination.Total != 1 {
		t.Errorf("expected 1 item, got %d", list.Pagination.Total)
	}
}
