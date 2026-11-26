package repository

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/request"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
)

type SummaryAggregate struct {
	TotalDays          int
	PresentDays        int
	LateDays           int
	AbsentDays         int
	HalfDays           int
	TotalWorkedMinutes int
	TotalLateMinutes   int
}

type Repository interface {
	SaveAttendance(ctx context.Context, record *models.AttendanceRecord) error
	FindRecordByID(ctx context.Context, orgID, id string) (*models.AttendanceRecord, error)
	FindRecordByDate(ctx context.Context, orgID, employeeID string, date time.Time) (*models.AttendanceRecord, error)
	ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) ([]models.AttendanceRecord, int64, error)
	GetSummaryAggregate(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*SummaryAggregate, error)
	GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error)
	FindShiftByID(ctx context.Context, orgID, shiftID string) (*shiftmodels.Shift, error)
	ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error)
	GetOrgTimezone(ctx context.Context, orgID string) (string, error)
	GetGracePeriodMinutes(ctx context.Context, orgID string) (int, error)

	CreateCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error
	FindCorrectionByID(ctx context.Context, orgID, id string) (*models.AttendanceCorrectionRequest, error)
	ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) ([]models.AttendanceCorrectionRequest, int64, error)
	ApproveCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest, record *models.AttendanceRecord) error
	RejectCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) SaveAttendance(ctx context.Context, record *models.AttendanceRecord) error {
	var existing models.AttendanceRecord
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

func (r *repository) FindRecordByID(ctx context.Context, orgID, id string) (*models.AttendanceRecord, error) {
	var rec models.AttendanceRecord
	err := r.db.WithContext(ctx).Table("attendance_records a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, b.name as branch_name, d.name as department_name").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("LEFT JOIN shifts s ON s.id = a.shift_id").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Where("a.id = ? AND a.organization_id = ?", id, orgID).
		First(&rec).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *repository) FindRecordByDate(ctx context.Context, orgID, employeeID string, date time.Time) (*models.AttendanceRecord, error) {
	var rec models.AttendanceRecord
	dateOnly := date.Format("2006-01-02")
	err := r.db.WithContext(ctx).Table("attendance_records a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, b.name as branch_name, d.name as department_name").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("LEFT JOIN shifts s ON s.id = a.shift_id").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.attendance_date = ?", orgID, employeeID, dateOnly).
		First(&rec).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *repository) ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) ([]models.AttendanceRecord, int64, error) {
	query := r.db.WithContext(ctx).Table("attendance_records a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, b.name as branch_name, d.name as department_name").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("LEFT JOIN shifts s ON s.id = a.shift_id").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Where("a.organization_id = ?", orgID)

	if q.EmployeeID != "" {
		query = query.Where("a.employee_id = ?", q.EmployeeID)
	}
	if q.BranchID != "" {
		query = query.Where("e.branch_id = ?", q.BranchID)
	}
	if q.DepartmentID != "" {
		query = query.Where("e.department_id = ?", q.DepartmentID)
	}
	if q.Status != "" {
		query = query.Where("LOWER(a.attendance_status) = LOWER(?)", q.Status)
	}
	if q.Date != "" {
		query = query.Where("a.attendance_date = ?", q.Date)
	}
	if q.From != "" {
		query = query.Where("a.attendance_date >= ?", q.From)
	}
	if q.To != "" {
		query = query.Where("a.attendance_date <= ?", q.To)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
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

	var items []models.AttendanceRecord
	if err := query.Order("a.attendance_date DESC, a.check_in DESC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) GetSummaryAggregate(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*SummaryAggregate, error) {
	query := r.db.WithContext(ctx).Table("attendance_records a").
		Select(`
			COUNT(*) as total_days,
			COUNT(*) FILTER (WHERE UPPER(a.attendance_status) = 'PRESENT') as present_days,
			COUNT(*) FILTER (WHERE UPPER(a.attendance_status) = 'LATE') as late_days,
			COUNT(*) FILTER (WHERE UPPER(a.attendance_status) = 'ABSENT') as absent_days,
			COUNT(*) FILTER (WHERE UPPER(a.attendance_status) = 'HALF_DAY') as half_days,
			COALESCE(SUM(a.worked_minutes), 0) as total_worked_minutes,
			COALESCE(SUM(a.late_minutes), 0) as total_late_minutes
		`).
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Where("a.organization_id = ? AND a.attendance_date >= ? AND a.attendance_date <= ?", orgID, q.From, q.To)

	if q.EmployeeID != "" {
		query = query.Where("a.employee_id = ?", q.EmployeeID)
	}
	if q.BranchID != "" {
		query = query.Where("e.branch_id = ?", q.BranchID)
	}
	if q.DepartmentID != "" {
		query = query.Where("e.department_id = ?", q.DepartmentID)
	}

	var agg SummaryAggregate
	if err := query.Scan(&agg).Error; err != nil {
		return nil, err
	}
	return &agg, nil
}

func (r *repository) GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error) {
	dateOnly := date.Format("2006-01-02")
	var shift shiftmodels.Shift
	err := r.db.WithContext(ctx).Table("shifts s").
		Joins("JOIN employee_shift_assignments a ON a.shift_id = s.id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.status = 'ACTIVE' AND a.deleted_at IS NULL AND s.deleted_at IS NULL", orgID, employeeID).
		Where("a.effective_from <= ? AND (a.effective_to IS NULL OR a.effective_to >= ?)", dateOnly, dateOnly).
		Order("a.effective_from DESC").
		First(&shift).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = r.db.WithContext(ctx).Table("shifts").
				Where("organization_id = ? AND is_default = TRUE AND status = 'ACTIVE' AND deleted_at IS NULL", orgID).
				First(&shift).Error
			if err != nil {
				return nil, nil
			}
			return &shift, nil
		}
		return nil, err
	}
	return &shift, nil
}

func (r *repository) FindShiftByID(ctx context.Context, orgID, shiftID string) (*shiftmodels.Shift, error) {
	var shift shiftmodels.Shift
	err := r.db.WithContext(ctx).Table("shifts").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL", shiftID, orgID).
		First(&shift).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &shift, nil
}

func (r *repository) ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("employee_identities").
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", employeeID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) GetOrgTimezone(ctx context.Context, orgID string) (string, error) {
	var val string
	err := r.db.WithContext(ctx).Table("organization_settings").
		Select("setting_value").
		Where("organization_id = ? AND setting_key = 'timezone'", orgID).
		Limit(1).
		Scan(&val).Error
	if err == nil && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val), nil
	}

	var tz string
	err = r.db.WithContext(ctx).Table("organizations o").
		Select("c.default_timezone").
		Joins("JOIN countries c ON LOWER(c.iso_code) = LOWER(o.country) OR LOWER(c.name) = LOWER(o.country)").
		Where("o.id = ?", orgID).
		Limit(1).
		Scan(&tz).Error
	if err == nil && strings.TrimSpace(tz) != "" {
		return strings.TrimSpace(tz), nil
	}
	return "UTC", nil
}

func (r *repository) GetGracePeriodMinutes(ctx context.Context, orgID string) (int, error) {
	var val string
	err := r.db.WithContext(ctx).Table("organization_settings").
		Select("setting_value").
		Where("organization_id = ? AND setting_key = 'grace_period_minutes'", orgID).
		Limit(1).
		Scan(&val).Error
	if err == nil && strings.TrimSpace(val) != "" {
		if mins, convErr := strconv.Atoi(strings.TrimSpace(val)); convErr == nil && mins >= 0 {
			return mins, nil
		}
	}
	return 15, nil
}

func (r *repository) CreateCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error {
	return r.db.WithContext(ctx).Create(corr).Error
}

func (r *repository) FindCorrectionByID(ctx context.Context, orgID, id string) (*models.AttendanceCorrectionRequest, error) {
	var corr models.AttendanceCorrectionRequest
	err := r.db.WithContext(ctx).Table("attendance_correction_requests c").
		Select("c.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), oa.identifier) as reviewer_name").
		Joins("JOIN employee_identities e ON e.id = c.employee_id").
		Joins("LEFT JOIN organization_accounts oa ON oa.id = c.reviewed_by_account_id").
		Joins("LEFT JOIN employee_identities u ON u.id = oa.employee_id").
		Where("c.id = ? AND c.organization_id = ?", id, orgID).
		First(&corr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &corr, nil
}

func (r *repository) ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) ([]models.AttendanceCorrectionRequest, int64, error) {
	query := r.db.WithContext(ctx).Table("attendance_correction_requests c").
		Select("c.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), oa.identifier) as reviewer_name").
		Joins("JOIN employee_identities e ON e.id = c.employee_id").
		Joins("LEFT JOIN organization_accounts oa ON oa.id = c.reviewed_by_account_id").
		Joins("LEFT JOIN employee_identities u ON u.id = oa.employee_id").
		Where("c.organization_id = ?", orgID)

	if q.EmployeeID != "" {
		query = query.Where("c.employee_id = ?", q.EmployeeID)
	}
	if q.Status != "" {
		query = query.Where("LOWER(c.request_status) = LOWER(?)", q.Status)
	}
	if q.From != "" {
		query = query.Where("c.attendance_date >= ?", q.From)
	}
	if q.To != "" {
		query = query.Where("c.attendance_date <= ?", q.To)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
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

	var items []models.AttendanceCorrectionRequest
	if err := query.Order("c.created_at DESC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) ApproveCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest, record *models.AttendanceRecord) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(corr).Error; err != nil {
			return err
		}

		var existing models.AttendanceRecord
		dateOnly := record.AttendanceDate.Format("2006-01-02")
		err := tx.Where("organization_id = ? AND employee_id = ? AND attendance_date = ?", record.OrganizationID, record.EmployeeID, dateOnly).
			First(&existing).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return tx.Create(record).Error
			}
			return err
		}

		record.ID = existing.ID
		record.CreatedAt = existing.CreatedAt
		return tx.Save(record).Error
	})
}

func (r *repository) RejectCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error {
	return r.db.WithContext(ctx).Save(corr).Error
}
