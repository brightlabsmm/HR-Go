package service_test

import (
	"context"
	"testing"
	"time"

	attendancemodels "hrgo/backend/internal/modules/workspace/attendance/models"
	authmodels "hrgo/backend/internal/modules/workspace/auth/models"
	employeemodels "hrgo/backend/internal/modules/workspace/employee/models"
	holidaymodels "hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/mobile/models"
	"hrgo/backend/internal/modules/workspace/mobile/repository"
	"hrgo/backend/internal/modules/workspace/mobile/request"
	"hrgo/backend/internal/modules/workspace/mobile/service"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
	"hrgo/backend/internal/shared/security"
)

type mockMobileRepo struct {
	repository.Repository
	account     *authmodels.OrganizationAccount
	employee    *employeemodels.Employee
	profile     *employeemodels.EmployeeProfile
	device      *models.MobileDevice
	records     []attendancemodels.AttendanceRecord
	shift       *shiftmodels.Shift
	holidays    []holidaymodels.Holiday
	corrections []attendancemodels.AttendanceCorrectionRequest
}

func (m *mockMobileRepo) FindAccountByIdentifier(ctx context.Context, orgCode, identifier string) (*authmodels.OrganizationAccount, error) {
	return m.account, nil
}

func (m *mockMobileRepo) FindAccountByID(ctx context.Context, accountID string) (*authmodels.OrganizationAccount, error) {
	return m.account, nil
}

func (m *mockMobileRepo) FindEmployeeByID(ctx context.Context, employeeID string) (*employeemodels.Employee, error) {
	return m.employee, nil
}

func (m *mockMobileRepo) GetEmployeeFullDetails(ctx context.Context, orgID, employeeID string) (*employeemodels.Employee, *employeemodels.EmployeeProfile, error) {
	return m.employee, m.profile, nil
}

func (m *mockMobileRepo) UpsertDevice(ctx context.Context, device *models.MobileDevice) error {
	m.device = device
	return nil
}

func (m *mockMobileRepo) CreateSession(ctx context.Context, session *authmodels.WorkspaceSession) error {
	return nil
}

func (m *mockMobileRepo) UpdateLastLogin(ctx context.Context, accountID string) error {
	return nil
}

func (m *mockMobileRepo) GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error) {
	return m.shift, nil
}

func (m *mockMobileRepo) GetTodayAttendance(ctx context.Context, orgID, employeeID string, date time.Time) (*attendancemodels.AttendanceRecord, error) {
	dateStr := date.Format("2006-01-02")
	for i := range m.records {
		if m.records[i].AttendanceDate.Format("2006-01-02") == dateStr {
			return &m.records[i], nil
		}
	}
	return nil, nil
}

func (m *mockMobileRepo) SaveAttendance(ctx context.Context, record *attendancemodels.AttendanceRecord) error {
	for i := range m.records {
		if m.records[i].AttendanceDate.Format("2006-01-02") == record.AttendanceDate.Format("2006-01-02") {
			m.records[i] = *record
			return nil
		}
	}
	m.records = append(m.records, *record)
	return nil
}

func (m *mockMobileRepo) GetMonthlyHolidays(ctx context.Context, orgID string, branchID *string, startDate, endDate time.Time) ([]holidaymodels.Holiday, error) {
	return m.holidays, nil
}

func (m *mockMobileRepo) RecordOfflineEvent(ctx context.Context, event *models.OfflineAttendanceEvent) error {
	return nil
}

func (m *mockMobileRepo) RecordSyncResult(ctx context.Context, res *models.SynchronizationResult) error {
	return nil
}

func TestMobileService_LoginAndPunch(t *testing.T) {
	passHash, _ := security.HashPassword("Secret123!")
	account := &authmodels.OrganizationAccount{
		ID:             "acc-1",
		OrganizationID: "org-1",
		EmployeeID:     "emp-1",
		Identifier:     "EMP001",
		PasswordHash:   passHash,
		Status:         "ACTIVE",
		Organization: authmodels.Organization{
			ID:          "org-1",
			Code:        "TESTORG",
			Status:      "ACTIVE",
			DisplayName: "Test Org",
		},
		Employee: authmodels.EmployeeIdentity{
			ID:           "emp-1",
			EmployeeCode: "EMP001",
			FirstName:    "Alice",
			LastName:     "Smith",
			Email:        "alice@example.com",
		},
		UserRoles: []authmodels.OrgUserRole{
			{
				AccountID: "acc-1",
				RoleID:    "role-emp",
				Role: authmodels.OrgRole{
					Code: "EMPLOYEE",
					Name: "Employee",
					Permissions: []authmodels.Permission{
						{Code: "org.mobile.access"},
					},
				},
			},
		},
	}
	employee := &employeemodels.Employee{
		ID:               "emp-1",
		OrganizationID:   "org-1",
		EmployeeCode:     "EMP001",
		FirstName:        "Alice",
		LastName:         "Smith",
		EmploymentStatus: "ACTIVE",
	}

	repo := &mockMobileRepo{
		account:  account,
		employee: employee,
	}

	tokens := security.NewTokenManager("test-secret-key-32-chars-long!")
	svc := service.New(repo, tokens)
	ctx := context.Background()

	// 1. Mobile Login
	loginReq := request.MobileLoginRequest{
		Identifier:       "EMP001",
		Password:         "Secret123!",
		DeviceIdentifier: "device-uuid-12345",
		DeviceName:       "Pixel 8",
	}

	loginRes, err := svc.Login(ctx, loginReq)
	if err != nil {
		t.Fatalf("unexpected error during mobile login: %v", err)
	}
	if loginRes.AccessToken == "" {
		t.Errorf("expected access token to be non-empty")
	}
	if loginRes.Device.DeviceIdentifier != "device-uuid-12345" {
		t.Errorf("expected device identifier device-uuid-12345, got %s", loginRes.Device.DeviceIdentifier)
	}

	// 2. Mobile Check-In
	lat := 37.7749
	lon := -122.4194
	punchReq := request.MobilePunchRequest{
		Latitude:  &lat,
		Longitude: &lon,
	}

	inRes, err := svc.CheckIn(ctx, "org-1", "emp-1", punchReq)
	if err != nil {
		t.Fatalf("unexpected error checking in: %v", err)
	}
	if inRes.Source != "MOBILE" {
		t.Errorf("expected source MOBILE, got %s", inRes.Source)
	}

	// 3. Mobile Check-Out
	outRes, err := svc.CheckOut(ctx, "org-1", "emp-1", punchReq)
	if err != nil {
		t.Fatalf("unexpected error checking out: %v", err)
	}
	if outRes.CheckOut == nil {
		t.Errorf("expected checkout time to be recorded")
	}
}
