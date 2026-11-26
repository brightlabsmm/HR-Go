package service_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"hrgo/backend/internal/modules/workspace/employee/models"
	"hrgo/backend/internal/modules/workspace/employee/repository"
	"hrgo/backend/internal/modules/workspace/employee/request"
	"hrgo/backend/internal/modules/workspace/employee/response"
	"hrgo/backend/internal/modules/workspace/employee/service"
)

type mockEmployeeRepo struct {
	repository.Repository
	employees    []models.Employee
	profiles     map[string]models.EmployeeProfile
	accounts     []models.OrganizationAccount
	rejectBranch bool
	rejectRole   bool
	err          error
}

func (m *mockEmployeeRepo) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	return !m.rejectBranch, nil
}

func (m *mockEmployeeRepo) ValidateDepartment(ctx context.Context, orgID, departmentID string) (bool, error) {
	return true, nil
}

func (m *mockEmployeeRepo) ValidatePosition(ctx context.Context, orgID, positionID string) (bool, error) {
	return true, nil
}

func (m *mockEmployeeRepo) ValidateRole(ctx context.Context, orgID, roleID string) (bool, error) {
	return !m.rejectRole, nil
}

func (m *mockEmployeeRepo) GetNextEmployeeCode(ctx context.Context, orgID string) (string, error) {
	if m.err != nil {
		return "", m.err
	}
	return "EMP-001", nil
}

func (m *mockEmployeeRepo) Create(ctx context.Context, emp *models.Employee, prof *models.EmployeeProfile, account *models.OrganizationAccount, roleID *string) error {
	if m.err != nil {
		return m.err
	}
	emp.ID = fmt.Sprintf("emp-%d", len(m.employees)+1)
	emp.CreatedAt = time.Now().UTC()
	emp.UpdatedAt = time.Now().UTC()
	emp.RoleID = roleID
	m.employees = append(m.employees, *emp)
	if prof != nil {
		if m.profiles == nil {
			m.profiles = make(map[string]models.EmployeeProfile)
		}
		prof.ID = fmt.Sprintf("prof-%d", len(m.employees))
		prof.EmployeeID = emp.ID
		m.profiles[emp.ID] = *prof
	}
	if account != nil {
		m.accounts = append(m.accounts, *account)
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

func (m *mockEmployeeRepo) GetSummary(ctx context.Context, orgID, branchID string) (*response.EmployeeSummaryResponse, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &response.EmployeeSummaryResponse{
		TotalEmployees:  int64(len(m.employees)),
		ActiveEmployees: int64(len(m.employees)),
	}, nil
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

func (m *mockEmployeeRepo) Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, roleID *string, fallbackPassHash string) error {
	return nil
}

func (m *mockEmployeeRepo) SoftDelete(ctx context.Context, orgID, id string) error {
	return nil
}

func TestEmployeeService_RejectsCrossTenantReferences(t *testing.T) {
	email := "cross@example.com"
	branchID := "00000000-0000-0000-0000-000000000001"
	deptID := "00000000-0000-0000-0000-000000000002"
	posID := "00000000-0000-0000-0000-000000000003"
	roleID := "00000000-0000-0000-0000-000000000004"
	dob := "1995-05-05"
	gender := "FEMALE"
	nationality := "MM"
	emergency := "09123456"

	req := request.CreateEmployeeRequest{
		FirstName:        "Hla",
		LastName:         "Myint",
		Email:            &email,
		BranchID:         &branchID,
		DepartmentID:     &deptID,
		PositionID:       &posID,
		RoleID:           &roleID,
		DateOfBirth:      &dob,
		Gender:           &gender,
		Nationality:      &nationality,
		EmergencyContact: &emergency,
	}

	repo := &mockEmployeeRepo{rejectBranch: true}
	svc := service.New(repo)
	if _, err := svc.Create(context.Background(), "org-1", req); err == nil {
		t.Fatalf("expected validation error for cross-tenant branchId")
	}

	repo2 := &mockEmployeeRepo{rejectRole: true}
	svc2 := service.New(repo2)
	if _, err := svc2.Create(context.Background(), "org-1", req); err == nil {
		t.Fatalf("expected validation error for cross-tenant roleId")
	}
}

func TestEmployeeService_CreateAndList(t *testing.T) {
	repo := &mockEmployeeRepo{}
	svc := service.New(repo)
	ctx := context.Background()

	email := "john.doe@example.com"
	branchID := "00000000-0000-0000-0000-000000000001"
	deptID := "00000000-0000-0000-0000-000000000002"
	posID := "00000000-0000-0000-0000-000000000003"
	roleID := "00000000-0000-0000-0000-000000000004"
	dob := "1990-01-01"
	gender := "MALE"
	nationality := "US"
	emergencyContact := "Emergency Person 555-1234"

	req := request.CreateEmployeeRequest{
		EmployeeCode:     "EMP001",
		FirstName:        "John",
		LastName:         "Doe",
		Email:            &email,
		BranchID:         &branchID,
		DepartmentID:     &deptID,
		PositionID:       &posID,
		RoleID:           &roleID,
		DateOfBirth:      &dob,
		Gender:           &gender,
		Nationality:      &nationality,
		EmergencyContact: &emergencyContact,
	}

	res, err := svc.Create(ctx, "org-1", req)
	if err != nil {
		t.Fatalf("unexpected error creating employee: %v", err)
	}
	if res.EmployeeCode != "EMP001" {
		t.Errorf("expected EMP001, got %s", res.EmployeeCode)
	}
	if res.GeneratedPassword == nil || len(*res.GeneratedPassword) < 8 {
		t.Errorf("expected generated password to be at least 8 chars, got %v", res.GeneratedPassword)
	}
	if len(repo.accounts) != 1 || repo.accounts[0].Identifier != "EMP001" {
		t.Errorf("expected organization account with identifier EMP001, got %+v", repo.accounts)
	}

	// Test auto-generation when EmployeeCode is empty
	email2 := "jane.smith@example.com"
	autoReq := request.CreateEmployeeRequest{
		FirstName:        "Jane",
		LastName:         "Smith",
		Email:            &email2,
		BranchID:         &branchID,
		DepartmentID:     &deptID,
		PositionID:       &posID,
		RoleID:           &roleID,
		DateOfBirth:      &dob,
		Gender:           &gender,
		Nationality:      &nationality,
		EmergencyContact: &emergencyContact,
	}
	autoRes, err := svc.Create(ctx, "org-1", autoReq)
	if err != nil {
		t.Fatalf("unexpected error auto-creating employee: %v", err)
	}
	if autoRes.EmployeeCode != "EMP-001" {
		t.Errorf("expected auto code EMP-001, got %s", autoRes.EmployeeCode)
	}

	// Conflict check on duplicate code
	_, err = svc.Create(ctx, "org-1", req)
	if err == nil {
		t.Fatalf("expected error on duplicate employee code, got nil")
	}

	// List check (2 employees created: EMP001 and EMP-001)
	list, err := svc.List(ctx, "org-1", request.ListEmployeesQuery{})
	if err != nil {
		t.Fatalf("unexpected error listing employees: %v", err)
	}
	if list.Pagination.Total != 2 {
		t.Errorf("expected 2 items, got %d", list.Pagination.Total)
	}

	summary, sumErr := svc.GetSummary(ctx, "org-1", "")
	if sumErr != nil {
		t.Fatalf("unexpected error getting employee summary: %v", sumErr)
	}
	if summary.TotalEmployees != 2 {
		t.Errorf("expected summary totalEmployees=2, got %d", summary.TotalEmployees)
	}

	repo.rejectBranch = true
	if _, branchErr := svc.GetSummary(ctx, "org-1", "invalid-branch"); branchErr == nil {
		t.Fatalf("expected validation error for unknown branchId")
	}
}
