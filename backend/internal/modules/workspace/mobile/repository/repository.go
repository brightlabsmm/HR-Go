package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	attendancemodels "hrgo/backend/internal/modules/workspace/attendance/models"
	authmodels "hrgo/backend/internal/modules/workspace/auth/models"
	employeemodels "hrgo/backend/internal/modules/workspace/employee/models"
	holidaymodels "hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/mobile/models"
	"hrgo/backend/internal/modules/workspace/mobile/request"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
)

type Repository interface {
	FindAccountByIdentifier(ctx context.Context, orgCode, identifier string) (*authmodels.OrganizationAccount, error)
	FindAccountByID(ctx context.Context, accountID string) (*authmodels.OrganizationAccount, error)
	FindEmployeeByID(ctx context.Context, employeeID string) (*employeemodels.Employee, error)
	GetEmployeeFullDetails(ctx context.Context, orgID, employeeID string) (*employeemodels.Employee, *employeemodels.EmployeeProfile, error)
	UpsertDevice(ctx context.Context, device *models.MobileDevice) error
	CreateSession(ctx context.Context, session *authmodels.WorkspaceSession) error
	UpdateLastLogin(ctx context.Context, accountID string) error
	UpdatePassword(ctx context.Context, accountID, passwordHash string) error

	GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error)
	GetTodayAttendance(ctx context.Context, orgID, employeeID string, date time.Time) (*attendancemodels.AttendanceRecord, error)
	SaveAttendance(ctx context.Context, record *attendancemodels.AttendanceRecord) error
	ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) ([]attendancemodels.AttendanceRecord, int64, error)
	GetMonthlyAttendance(ctx context.Context, orgID, employeeID string, startDate, endDate time.Time) ([]attendancemodels.AttendanceRecord, error)
	GetMonthlyHolidays(ctx context.Context, orgID string, branchID *string, startDate, endDate time.Time) ([]holidaymodels.Holiday, error)

	CreateCorrection(ctx context.Context, corr *attendancemodels.AttendanceCorrectionRequest) error
	FindRecordByID(ctx context.Context, orgID, recordID string) (*attendancemodels.AttendanceRecord, error)
	ListCorrections(ctx context.Context, orgID, employeeID string, q request.ListMobileCorrectionsQuery) ([]attendancemodels.AttendanceCorrectionRequest, int64, error)

	RecordOfflineEvent(ctx context.Context, event *models.OfflineAttendanceEvent) error
	RecordSyncResult(ctx context.Context, res *models.SynchronizationResult) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindAccountByIdentifier(ctx context.Context, orgCode, identifier string) (*authmodels.OrganizationAccount, error) {
	var acc authmodels.OrganizationAccount
	q := r.db.WithContext(ctx).
		Preload("Organization").
		Preload("Employee").
		Preload("UserRoles.Role.Permissions").
		Joins("JOIN organizations o ON o.id = organization_accounts.organization_id").
		Joins("JOIN employee_identities e ON e.id = organization_accounts.employee_id").
		Where("(LOWER(organization_accounts.identifier) = LOWER(?) OR LOWER(e.email) = LOWER(?) OR LOWER(e.employee_code) = LOWER(?))", identifier, identifier, identifier)

	if strings.TrimSpace(orgCode) != "" {
		q = q.Where("LOWER(o.code) = LOWER(?)", strings.TrimSpace(orgCode))
	}

	err := q.Order("o.deleted_at NULLS FIRST").First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) FindAccountByID(ctx context.Context, accountID string) (*authmodels.OrganizationAccount, error) {
	var acc authmodels.OrganizationAccount
	err := r.db.WithContext(ctx).
		Preload("Organization").
		Preload("Employee").
		Preload("UserRoles.Role.Permissions").
		Where("id = ?", accountID).
		First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) FindEmployeeByID(ctx context.Context, employeeID string) (*employeemodels.Employee, error) {
	var emp employeemodels.Employee
	err := r.db.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", employeeID).First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *repository) GetEmployeeFullDetails(ctx context.Context, orgID, employeeID string) (*employeemodels.Employee, *employeemodels.EmployeeProfile, error) {
	var emp employeemodels.Employee
	err := r.db.WithContext(ctx).Table("employee_identities e").
		Select("e.*, b.name as branch_name, d.name as department_name, p.title as position_title").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN positions p ON p.id = e.position_id").
		Where("e.id = ? AND e.organization_id = ? AND e.deleted_at IS NULL", employeeID, orgID).
		First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, nil
		}
		return nil, nil, err
	}

	var prof employeemodels.EmployeeProfile
	if err := r.db.WithContext(ctx).Where("employee_id = ?", employeeID).First(&prof).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}

	return &emp, &prof, nil
}

func (r *repository) UpsertDevice(ctx context.Context, device *models.MobileDevice) error {
	var existing models.MobileDevice
	err := r.db.WithContext(ctx).
		Where("organization_account_id = ? AND device_identifier = ?", device.OrganizationAccountID, device.DeviceIdentifier).
		First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return r.db.WithContext(ctx).Create(device).Error
		}
		return err
	}
	device.ID = existing.ID
	device.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(device).Error
}

func (r *repository) CreateSession(ctx context.Context, session *authmodels.WorkspaceSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *repository) UpdateLastLogin(ctx context.Context, accountID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&authmodels.OrganizationAccount{}).
		Where("id = ?", accountID).
		Update("last_login_at", &now).Error
}

func (r *repository) UpdatePassword(ctx context.Context, accountID, passwordHash string) error {
	return r.db.WithContext(ctx).
		Model(&authmodels.OrganizationAccount{}).
		Where("id = ?", accountID).
		Updates(map[string]interface{}{
			"password_hash":        passwordHash,
			"must_change_password": false,
		}).Error
}

func (r *repository) GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error) {
	dateOnly := date.Format("2006-01-02")
	var shift shiftmodels.Shift

	err := r.db.WithContext(ctx).Table("shifts s").
		Joins("JOIN employee_shift_assignments a ON a.shift_id = s.id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.status = 'ACTIVE' AND a.deleted_at IS NULL", orgID, employeeID).
		Where("a.effective_from <= ? AND (a.effective_to IS NULL OR a.effective_to >= ?)", dateOnly, dateOnly).
		First(&shift).Error

	if err == nil {
		return &shift, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	err = r.db.WithContext(ctx).
		Where("organization_id = ? AND is_default = TRUE AND status = 'ACTIVE' AND deleted_at IS NULL", orgID).
		First(&shift).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &shift, nil
}

func (r *repository) GetTodayAttendance(ctx context.Context, orgID, employeeID string, date time.Time) (*attendancemodels.AttendanceRecord, error) {
	dateOnly := date.Format("2006-01-02")
	var record attendancemodels.AttendanceRecord
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND attendance_date = ?", orgID, employeeID, dateOnly).
		First(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}

func (r *repository) SaveAttendance(ctx context.Context, record *attendancemodels.AttendanceRecord) error {
	var existing attendancemodels.AttendanceRecord
	dateOnly := record.AttendanceDate.Format("2006-01-02")
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND attendance_date = ?", record.OrganizationID, record.EmployeeID, dateOnly).
		First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return r.db.WithContext(ctx).Create(record).Error
		}
		return err
	}

	record.ID = existing.ID
	record.CreatedAt = existing.CreatedAt
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *repository) ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) ([]attendancemodels.AttendanceRecord, int64, error) {
	var records []attendancemodels.AttendanceRecord
	var total int64

	db := r.db.WithContext(ctx).Table("attendance_records a").
		Select("a.*, s.shift_name").
		Joins("LEFT JOIN shifts s ON s.id = a.shift_id").
		Where("a.organization_id = ? AND a.employee_id = ?", orgID, employeeID)

	if q.StartDate != nil && *q.StartDate != "" {
		db = db.Where("a.attendance_date >= ?", *q.StartDate)
	}
	if q.EndDate != nil && *q.EndDate != "" {
		db = db.Where("a.attendance_date <= ?", *q.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	err := db.Order("a.attendance_date DESC").Offset(offset).Limit(pageSize).Find(&records).Error
	return records, total, err
}

func (r *repository) GetMonthlyAttendance(ctx context.Context, orgID, employeeID string, startDate, endDate time.Time) ([]attendancemodels.AttendanceRecord, error) {
	var records []attendancemodels.AttendanceRecord
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND attendance_date >= ? AND attendance_date <= ?",
			orgID, employeeID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02")).
		Order("attendance_date ASC").
		Find(&records).Error
	return records, err
}

func (r *repository) GetMonthlyHolidays(ctx context.Context, orgID string, branchID *string, startDate, endDate time.Time) ([]holidaymodels.Holiday, error) {
	var holidays []holidaymodels.Holiday
	q := r.db.WithContext(ctx).
		Where("organization_id = ? AND deleted_at IS NULL", orgID).
		Where("start_date <= ? AND end_date >= ?", endDate.Format("2006-01-02"), startDate.Format("2006-01-02"))

	if branchID != nil && *branchID != "" {
		q = q.Where("(branch_id IS NULL OR branch_id = ?)", *branchID)
	} else {
		q = q.Where("branch_id IS NULL")
	}

	err := q.Find(&holidays).Error
	return holidays, err
}

func (r *repository) CreateCorrection(ctx context.Context, corr *attendancemodels.AttendanceCorrectionRequest) error {
	return r.db.WithContext(ctx).Create(corr).Error
}

func (r *repository) FindRecordByID(ctx context.Context, orgID, recordID string) (*attendancemodels.AttendanceRecord, error) {
	var rec attendancemodels.AttendanceRecord
	err := r.db.WithContext(ctx).Where("organization_id = ? AND id = ?", orgID, recordID).First(&rec).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *repository) ListCorrections(ctx context.Context, orgID, employeeID string, q request.ListMobileCorrectionsQuery) ([]attendancemodels.AttendanceCorrectionRequest, int64, error) {
	var items []attendancemodels.AttendanceCorrectionRequest
	var total int64

	db := r.db.WithContext(ctx).Table("attendance_correction_requests c").
		Select("c.*, (e.first_name || ' ' || e.last_name) as employee_name, e.employee_code, r.attendance_date, (u.first_name || ' ' || u.last_name) as reviewer_name").
		Joins("JOIN employee_identities e ON e.id = c.employee_id").
		Joins("JOIN attendance_records r ON r.id = c.attendance_record_id").
		Joins("LEFT JOIN organization_accounts oa ON oa.id = c.reviewed_by").
		Joins("LEFT JOIN employee_identities u ON u.id = oa.employee_id").
		Where("c.organization_id = ? AND c.employee_id = ?", orgID, employeeID)

	if q.Status != nil && *q.Status != "" {
		db = db.Where("c.request_status = ?", *q.Status)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	err := db.Order("c.created_at DESC").Offset(offset).Limit(pageSize).Find(&items).Error
	return items, total, err
}

func (r *repository) RecordOfflineEvent(ctx context.Context, event *models.OfflineAttendanceEvent) error {
	var existing models.OfflineAttendanceEvent
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND local_event_id = ?", event.OrganizationID, event.EmployeeID, event.LocalEventID).
		First(&existing).Error
	if err == nil {
		event.ID = existing.ID
		event.SyncStatus = existing.SyncStatus
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *repository) RecordSyncResult(ctx context.Context, res *models.SynchronizationResult) error {
	return r.db.WithContext(ctx).Create(res).Error
}
