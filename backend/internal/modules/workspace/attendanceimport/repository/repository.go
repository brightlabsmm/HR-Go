package repository

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/workspace/attendanceimport/models"
	"hrgo/backend/internal/modules/workspace/attendanceimport/request"
)

type ExportRow struct {
	EmployeeCode      string     `gorm:"column:employee_code"`
	EmployeeName      string     `gorm:"column:employee_name"`
	BranchName        *string    `gorm:"column:branch_name"`
	ShiftName         *string    `gorm:"column:shift_name"`
	AttendanceDate    time.Time  `gorm:"column:attendance_date"`
	CheckIn           *time.Time `gorm:"column:check_in"`
	CheckOut          *time.Time `gorm:"column:check_out"`
	AttendanceStatus  string     `gorm:"column:attendance_status"`
	LateMinutes       int        `gorm:"column:late_minutes"`
	EarlyLeaveMinutes int        `gorm:"column:early_leave_minutes"`
	WorkedMinutes     int        `gorm:"column:worked_minutes"`
	Source            string     `gorm:"column:source"`
	Remarks           *string    `gorm:"column:remarks"`
}

type ImportRecordUpsert struct {
	OrganizationID   string     `gorm:"column:organization_id"`
	EmployeeID       string     `gorm:"column:employee_id"`
	AttendanceDate   time.Time  `gorm:"column:attendance_date;type:date"`
	CheckIn          *time.Time `gorm:"column:check_in"`
	CheckOut         *time.Time `gorm:"column:check_out"`
	AttendanceStatus string     `gorm:"column:attendance_status"`
	WorkedMinutes    int        `gorm:"column:worked_minutes"`
	Source           string     `gorm:"column:source"`
	Remarks          *string    `gorm:"column:remarks"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	UpdatedAt        time.Time  `gorm:"column:updated_at"`
}

func (ImportRecordUpsert) TableName() string {
	return "attendance_records"
}

type Repository interface {
	GetOrgTimezone(ctx context.Context, orgID string) string
	FindEmployeeIDByCode(ctx context.Context, orgID, employeeCode string) (string, error)
	UpsertAttendanceRecord(ctx context.Context, rec *ImportRecordUpsert) error
	CreateBatch(ctx context.Context, batch *models.AttendanceImportBatch) error
	ListBatches(ctx context.Context, orgID string, page, pageSize int) ([]models.AttendanceImportBatch, int64, error)
	ListExportRows(ctx context.Context, orgID string, q request.ExportAttendanceQuery) ([]ExportRow, error)
}

type repo struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repo{db: db}
}

func (r *repo) GetOrgTimezone(ctx context.Context, orgID string) string {
	var val string
	err := r.db.WithContext(ctx).
		Table("organization_settings").
		Select("setting_value").
		Where("organization_id = ? AND setting_key = 'timezone'", orgID).
		Limit(1).
		Scan(&val).Error
	if err == nil && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}

	var tz string
	err = r.db.WithContext(ctx).
		Table("organizations o").
		Select("c.default_timezone").
		Joins("JOIN countries c ON LOWER(c.iso_code) = LOWER(o.country) OR LOWER(c.name) = LOWER(o.country)").
		Where("o.id = ?", orgID).
		Limit(1).
		Scan(&tz).Error
	if err == nil && strings.TrimSpace(tz) != "" {
		return strings.TrimSpace(tz)
	}
	return "Asia/Yangon"
}

func (r *repo) FindEmployeeIDByCode(ctx context.Context, orgID, employeeCode string) (string, error) {
	var id string
	err := r.db.WithContext(ctx).
		Table("employee_identities").
		Select("id").
		Where("organization_id = ? AND employee_code = ? AND deleted_at IS NULL", orgID, employeeCode).
		Take(&id).Error
	return id, err
}

func (r *repo) UpsertAttendanceRecord(ctx context.Context, rec *ImportRecordUpsert) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "organization_id"},
			{Name: "employee_id"},
			{Name: "attendance_date"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"check_in", "check_out", "attendance_status", "worked_minutes", "source", "remarks", "updated_at",
		}),
	}).Create(rec).Error
}

func (r *repo) CreateBatch(ctx context.Context, batch *models.AttendanceImportBatch) error {
	return r.db.WithContext(ctx).Create(batch).Error
}

func (r *repo) ListBatches(ctx context.Context, orgID string, page, pageSize int) ([]models.AttendanceImportBatch, int64, error) {
	tx := r.db.WithContext(ctx).Model(&models.AttendanceImportBatch{}).Where("organization_id = ?", orgID)
	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []models.AttendanceImportBatch
	if err := tx.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *repo) ListExportRows(ctx context.Context, orgID string, q request.ExportAttendanceQuery) ([]ExportRow, error) {
	tx := r.db.WithContext(ctx).
		Table("attendance_records ar").
		Select(`e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			b.name AS branch_name,
			s.shift_name,
			ar.attendance_date,
			ar.check_in,
			ar.check_out,
			ar.attendance_status,
			ar.late_minutes,
			ar.early_leave_minutes,
			ar.worked_minutes,
			ar.source,
			ar.remarks`).
		Joins("JOIN employee_identities e ON e.id = ar.employee_id").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN shifts s ON s.id = ar.shift_id").
		Where("ar.organization_id = ?", orgID)

	if q.From != "" {
		tx = tx.Where("ar.attendance_date >= ?", q.From)
	}
	if q.To != "" {
		tx = tx.Where("ar.attendance_date <= ?", q.To)
	}
	if q.BranchID != "" {
		tx = tx.Where("e.branch_id = ?", q.BranchID)
	}
	if q.Status != "" {
		tx = tx.Where("LOWER(ar.attendance_status) = LOWER(?)", q.Status)
	}

	var rows []ExportRow
	if err := tx.Order("ar.attendance_date DESC, e.employee_code ASC").Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
