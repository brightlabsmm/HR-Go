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
	account       *authmodels.OrganizationAccount
	employee      *employeemodels.Employee
	profile       *employeemodels.EmployeeProfile
	posHistory    []employeemodels.EmployeePositionHistory
	device        *models.MobileDevice
	records       []attendancemodels.AttendanceRecord
	shift         *shiftmodels.Shift
	holidays      []holidaymodels.Holiday
	corrections   []models.MobileCorrectionRow
	offlineEvents map[string]*models.OfflineAttendanceEvent
	syncResults   []models.SynchronizationResult
	timezone      string
	graceMinutes  int
	workDays      []string
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

func (m *mockMobileRepo) ListPositionHistory(ctx context.Context, orgID, employeeID string) ([]employeemodels.EmployeePositionHistory, error) {
	return m.posHistory, nil
}

func (m *mockMobileRepo) GetOrgTimezone(ctx context.Context, orgID string) (string, error) {
	if m.timezone == "" {
		return "UTC", nil
	}
	return m.timezone, nil
}

func (m *mockMobileRepo) GetGracePeriodMinutes(ctx context.Context, orgID string) (int, error) {
	if m.graceMinutes <= 0 {
		return 15, nil
	}
	return m.graceMinutes, nil
}

func (m *mockMobileRepo) GetWorkDays(ctx context.Context, orgID string) ([]string, error) {
	if len(m.workDays) == 0 {
		return []string{"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}, nil
	}
	return m.workDays, nil
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

func (m *mockMobileRepo) UpdatePassword(ctx context.Context, accountID, passwordHash string) error {
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

func (m *mockMobileRepo) ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) ([]attendancemodels.AttendanceRecord, int64, error) {
	return m.records, int64(len(m.records)), nil
}

func (m *mockMobileRepo) GetMonthlyAttendance(ctx context.Context, orgID, employeeID string, startDate, endDate time.Time) ([]attendancemodels.AttendanceRecord, error) {
	return m.records, nil
}

func (m *mockMobileRepo) GetMonthlyHolidays(ctx context.Context, orgID string, branchID *string, startDate, endDate time.Time) ([]holidaymodels.Holiday, error) {
	return m.holidays, nil
}

func (m *mockMobileRepo) CreateCorrection(ctx context.Context, corr *attendancemodels.AttendanceCorrectionRequest) error {
	m.corrections = append(m.corrections, models.MobileCorrectionRow{
		ID:                corr.ID,
		OrganizationID:    corr.OrganizationID,
		AttendanceID:      corr.AttendanceID,
		EmployeeID:        corr.EmployeeID,
		AttendanceDate:    corr.AttendanceDate,
		RequestedCheckIn:  corr.RequestedCheckIn,
		RequestedCheckOut: corr.RequestedCheckOut,
		Reason:            corr.Reason,
		RequestStatus:     corr.RequestStatus,
		CreatedAt:         corr.CreatedAt,
		UpdatedAt:         corr.UpdatedAt,
	})
	return nil
}

func (m *mockMobileRepo) FindRecordByID(ctx context.Context, orgID, recordID string) (*attendancemodels.AttendanceRecord, error) {
	for i := range m.records {
		if m.records[i].ID == recordID {
			return &m.records[i], nil
		}
	}
	return nil, nil
}

func (m *mockMobileRepo) FindCorrectionByID(ctx context.Context, orgID, employeeID, id string) (*models.MobileCorrectionRow, error) {
	for i := range m.corrections {
		if m.corrections[i].ID == id {
			return &m.corrections[i], nil
		}
	}
	return nil, nil
}

func (m *mockMobileRepo) ListCorrections(ctx context.Context, orgID, employeeID string, q request.ListMobileCorrectionsQuery) ([]models.MobileCorrectionRow, int64, error) {
	return m.corrections, int64(len(m.corrections)), nil
}

func (m *mockMobileRepo) RecordOfflineEvent(ctx context.Context, event *models.OfflineAttendanceEvent) error {
	if m.offlineEvents == nil {
		m.offlineEvents = make(map[string]*models.OfflineAttendanceEvent)
	}
	if existing, ok := m.offlineEvents[event.LocalEventID]; ok {
		event.ID = existing.ID
		event.SyncStatus = existing.SyncStatus
		return nil
	}
	copied := *event
	m.offlineEvents[event.LocalEventID] = &copied
	return nil
}

func (m *mockMobileRepo) MarkOfflineEventSynced(ctx context.Context, eventID string, syncedAt time.Time) error {
	for _, ev := range m.offlineEvents {
		if ev.ID == eventID {
			ev.SyncStatus = "SYNCED"
			ev.SyncedAt = &syncedAt
		}
	}
	return nil
}

func (m *mockMobileRepo) RecordSyncResult(ctx context.Context, res *models.SynchronizationResult) error {
	m.syncResults = append(m.syncResults, *res)
	return nil
}

func newTestAccount() *authmodels.OrganizationAccount {
	passHash, _ := security.HashPassword("Secret123!")
	return &authmodels.OrganizationAccount{
		ID:             "acc-1",
		OrganizationID: "org-1",
		EmployeeID:     "emp-1",
		Identifier:     "EMP001",
		PasswordHash:   passHash,
		Status:         "ACTIVE",
		Organization: authmodels.Organization{
			ID:          "org-1",
			Code:        "TESTORG",
			LegalName:   "Test Org Co., Ltd.",
			DisplayName: "Test Org",
			Status:      "ACTIVE",
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
}

func TestMobileService_Login30DayTokenAndPunch(t *testing.T) {
	account := newTestAccount()
	employee := &employeemodels.Employee{
		ID:               "emp-1",
		OrganizationID:   "org-1",
		EmployeeCode:     "EMP001",
		FirstName:        "Alice",
		LastName:         "Smith",
		EmploymentStatus: "ACTIVE",
		BranchName:       "Yangon HQ",
		DepartmentName:   "Engineering",
		PositionTitle:    "Software Engineer",
	}

	repo := &mockMobileRepo{
		account:  account,
		employee: employee,
		timezone: "Asia/Yangon",
	}

	tokens := security.NewTokenManager("test-secret-key-32-chars-long!")
	svc := service.New(repo, tokens)
	ctx := context.Background()

	loginReq := request.MobileLoginRequest{
		Identifier:       "EMP001",
		Password:         "Secret123!",
		DeviceIdentifier: "device-uuid-12345",
		DeviceName:       "Pixel 8",
	}

	loginRes, appErr := svc.Login(ctx, loginReq)
	if appErr != nil {
		t.Fatalf("unexpected error during mobile login: %v", appErr)
	}
	if loginRes.AccessToken == "" {
		t.Fatalf("expected access token to be non-empty")
	}
	if loginRes.ExpiresIn != 30*24*3600 {
		t.Fatalf("expected 30-day expiry (%d), got %d", 30*24*3600, loginRes.ExpiresIn)
	}
	claims, err := tokens.ValidateToken(loginRes.AccessToken)
	if err != nil {
		t.Fatalf("expected issued mobile token to validate: %v", err)
	}
	if time.Until(claims.ExpiresAt.Time) < 29*24*time.Hour {
		t.Errorf("expected JWT ExpiresAt to be ~30 days ahead, got %v", claims.ExpiresAt.Time)
	}

	lat := 16.8409
	lon := 96.1735
	punchReq := request.MobilePunchRequest{
		Latitude:  &lat,
		Longitude: &lon,
	}

	inRes, appErr := svc.CheckIn(ctx, "org-1", "emp-1", punchReq)
	if appErr != nil {
		t.Fatalf("unexpected error checking in: %v", appErr)
	}
	if inRes.CheckInSource == nil || *inRes.CheckInSource != "MOBILE" {
		t.Errorf("expected checkInSource MOBILE, got %v", inRes.CheckInSource)
	}
	if inRes.CheckInTime == nil {
		t.Errorf("expected checkInTime to be populated")
	}

	todayRes, appErr := svc.GetTodayAttendance(ctx, "org-1", "emp-1")
	if appErr != nil {
		t.Fatalf("unexpected error getting today status: %v", appErr)
	}
	if todayRes.Status != "WORKING" {
		t.Errorf("expected status WORKING before checkout, got %s", todayRes.Status)
	}

	outRes, appErr := svc.CheckOut(ctx, "org-1", "emp-1", punchReq)
	if appErr != nil {
		t.Fatalf("unexpected error checking out: %v", appErr)
	}
	if outRes.CheckOutTime == nil {
		t.Errorf("expected checkout time to be recorded")
	}
}

func TestMobileService_GetProfileIncludesFullContext(t *testing.T) {
	gender := "FEMALE"
	dob := time.Date(1996, 8, 12, 0, 0, 0, 0, time.UTC)
	repo := &mockMobileRepo{
		account: newTestAccount(),
		employee: &employeemodels.Employee{
			ID:               "emp-1",
			OrganizationID:   "org-1",
			EmployeeCode:     "EMP001",
			FirstName:        "Alice",
			LastName:         "Smith",
			BranchName:       "Yangon HQ",
			DepartmentName:   "Sales",
			PositionTitle:    "Sales Executive",
			EmploymentStatus: "ACTIVE",
		},
		profile: &employeemodels.EmployeeProfile{
			DateOfBirth: &dob,
			Gender:      &gender,
		},
		posHistory: []employeemodels.EmployeePositionHistory{
			{ID: "hist-1", NewPositionTitle: "Sales Executive", EffectiveDate: dob},
		},
	}

	tokens := security.NewTokenManager("test-secret-key-32-chars-long!")
	svc := service.New(repo, tokens)
	prof, appErr := svc.GetProfile(context.Background(), "acc-1", "org-1", "emp-1")
	if appErr != nil {
		t.Fatalf("unexpected error getting profile: %v", appErr)
	}
	if prof.AccountID != "acc-1" || prof.Organization.Code != "TESTORG" {
		t.Errorf("expected accountId and organization to be populated, got accountId=%q org=%q", prof.AccountID, prof.Organization.Code)
	}
	if len(prof.Roles) != 1 || len(prof.Permissions) != 1 {
		t.Errorf("expected roles and permissions in profile, got roles=%v perms=%v", prof.Roles, prof.Permissions)
	}
	if prof.Profile == nil || prof.Profile.Gender == nil || *prof.Profile.Gender != "FEMALE" {
		t.Errorf("expected personal profile fields to be populated")
	}
	if len(prof.PositionHistory) != 1 {
		t.Errorf("expected 1 position history entry, got %d", len(prof.PositionHistory))
	}
}

func TestMobileService_SyncOfflinePunchesStatuses(t *testing.T) {
	repo := &mockMobileRepo{
		account:      newTestAccount(),
		employee:     &employeemodels.Employee{ID: "emp-1", OrganizationID: "org-1"},
		timezone:     "Asia/Yangon",
		graceMinutes: 15,
		shift: &shiftmodels.Shift{
			ID:           "shift-1",
			ShiftName:    "Morning Shift",
			StartTime:    "09:00",
			EndTime:      "18:00",
			BreakMinutes: 60,
		},
	}
	tokens := security.NewTokenManager("test-secret-key-32-chars-long!")
	svc := service.New(repo, tokens)

	// 09:30 Asia/Yangon == 03:00 UTC -> late (past 09:15 local grace)
	loc, _ := time.LoadLocation("Asia/Yangon")
	checkInLocal := time.Date(2026, 11, 20, 9, 30, 0, 0, loc)
	checkOutLocal := time.Date(2026, 11, 20, 18, 0, 0, 0, loc)

	res, appErr := svc.SyncOfflinePunches(context.Background(), "org-1", "emp-1", request.MobileSyncRequest{
		Events: []request.OfflineEventRequest{
			{LocalEventID: "ev-1", EventType: "CHECK_IN", LocalEventTime: checkInLocal},
			{LocalEventID: "ev-2", EventType: "CHECK_OUT", LocalEventTime: checkOutLocal},
			{LocalEventID: "ev-3", EventType: "CHECK_IN", LocalEventTime: checkInLocal},
		},
	})
	if appErr != nil {
		t.Fatalf("unexpected sync error: %v", appErr)
	}
	if res.SuccessCount != 2 || res.FailedCount != 1 {
		t.Fatalf("expected 2 success and 1 failed, got %d/%d", res.SuccessCount, res.FailedCount)
	}
	if res.Results[0].ResultStatus != "ACCEPTED" || res.Results[1].ResultStatus != "ACCEPTED" || res.Results[2].ResultStatus != "CONFLICT" {
		t.Errorf("unexpected sync statuses: %+v", res.Results)
	}
	if len(repo.records) != 1 || repo.records[0].LateMinutes != 30 {
		t.Errorf("expected 30 late minutes for 09:30 check-in in Asia/Yangon, got %+v", repo.records)
	}

	// Re-syncing ev-1 must detect SYNCED and return CONFLICT without re-applying
	res2, appErr := svc.SyncOfflinePunches(context.Background(), "org-1", "emp-1", request.MobileSyncRequest{
		Events: []request.OfflineEventRequest{
			{LocalEventID: "ev-1", EventType: "CHECK_IN", LocalEventTime: checkInLocal},
		},
	})
	if appErr != nil || res2.Results[0].ResultStatus != "CONFLICT" {
		t.Errorf("expected repeat offline event to return CONFLICT, got %+v err=%v", res2, appErr)
	}
}
