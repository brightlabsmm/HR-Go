package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/request"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
)

type Repository interface {
	SaveAttendance(ctx context.Context, record *models.AttendanceRecord) error
	FindRecordByID(ctx context.Context, orgID, id string) (*models.AttendanceRecord, error)
	FindRecordByDate(ctx context.Context, orgID, employeeID string, date time.Time) (*models.AttendanceRecord, error)
	ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) ([]models.AttendanceRecord, int64, error)
	GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*models.AttendanceRecord, error)
	GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error)

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

func (r *repository) GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*models.AttendanceRecord, error) {
	return nil, nil
}

func (r *repository) GetAssignedShift(ctx context.Context, orgID, employeeID string, date time.Time) (*shiftmodels.Shift, error) {
	dateOnly := date.Format("2006-01-02")
	var shift shiftmodels.Shift
	err := r.db.WithContext(ctx).Table("shifts s").
		Joins("JOIN employee_shift_assignments a ON a.shift_id = s.id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.status = 'ACTIVE' AND a.deleted_at IS NULL", orgID, employeeID).
		Where("a.effective_from <= ? AND (a.effective_to IS NULL OR a.effective_to >= ?)", dateOnly, dateOnly).
		Order("a.effective_from DESC").
		First(&shift).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// fallback to default org shift
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

func (r *repository) CreateCorrection(ctx context.Context, corr *models.AttendanceCorrectionRequest) error {
	return r.db.WithContext(ctx).Create(corr).Error
}

func (r *repository) FindCorrectionByID(ctx context.Context, orgID, id string) (*models.AttendanceCorrectionRequest, error) {
	var corr models.AttendanceCorrectionRequest
	err := r.db.WithContext(ctx).Table("attendance_correction_requests c").
		Select("c.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, (u.identifier) as reviewer_name").
		Joins("JOIN employee_identities e ON e.id = c.employee_id").
		Joins("LEFT JOIN organization_accounts u ON u.id = c.reviewed_by_account_id").
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
		Select("c.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, (u.identifier) as reviewer_name").
		Joins("JOIN employee_identities e ON e.id = c.employee_id").
		Joins("LEFT JOIN organization_accounts u ON u.id = c.reviewed_by_account_id").
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

		// Save updated attendance record
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
