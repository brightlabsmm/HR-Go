package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/shift/models"
	"hrgo/backend/internal/modules/workspace/shift/request"
)

type Repository interface {
	CreateShift(ctx context.Context, shift *models.Shift) error
	FindShiftByID(ctx context.Context, orgID, id string) (*models.Shift, error)
	ListShifts(ctx context.Context, orgID string, q request.ListShiftsQuery) ([]models.Shift, int64, error)
	UpdateShift(ctx context.Context, shift *models.Shift) error
	SoftDeleteShift(ctx context.Context, orgID, id string) error
	UnsetDefaultShift(ctx context.Context, orgID string) error
	ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error)
	ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error)

	CreateAssignment(ctx context.Context, a *models.EmployeeShiftAssignment, history *models.EmployeeShiftAssignmentHistory) error
	FindAssignmentByID(ctx context.Context, orgID, id string) (*models.EmployeeShiftAssignment, error)
	FindCurrentAssignmentByEmployee(ctx context.Context, orgID, employeeID string, date time.Time) (*models.EmployeeShiftAssignment, error)
	ListAssignments(ctx context.Context, orgID string, q request.ListAssignmentsQuery) ([]models.EmployeeShiftAssignment, int64, error)
	ListEmployeeAssignments(ctx context.Context, orgID, employeeID string) ([]models.EmployeeShiftAssignment, error)
	ListAssignmentHistory(ctx context.Context, orgID, employeeID string) ([]models.EmployeeShiftAssignmentHistory, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateShift(ctx context.Context, shift *models.Shift) error {
	return r.db.WithContext(ctx).Create(shift).Error
}

func (r *repository) FindShiftByID(ctx context.Context, orgID, id string) (*models.Shift, error) {
	var shift models.Shift
	err := r.db.WithContext(ctx).Table("shifts s").
		Select("s.*, b.name as branch_name").
		Joins("LEFT JOIN branches b ON b.id = s.branch_id").
		Where("s.id = ? AND s.organization_id = ? AND s.deleted_at IS NULL", id, orgID).
		First(&shift).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &shift, nil
}

func (r *repository) ListShifts(ctx context.Context, orgID string, q request.ListShiftsQuery) ([]models.Shift, int64, error) {
	query := r.db.WithContext(ctx).Table("shifts s").
		Select("s.*, b.name as branch_name").
		Joins("LEFT JOIN branches b ON b.id = s.branch_id").
		Where("s.organization_id = ? AND s.deleted_at IS NULL", orgID)

	if q.BranchID != "" {
		query = query.Where("s.branch_id = ?", q.BranchID)
	}
	if q.Status != "" {
		query = query.Where("LOWER(s.status) = LOWER(?)", q.Status)
	}
	if q.Q != "" {
		search := "%" + strings.ToLower(strings.TrimSpace(q.Q)) + "%"
		query = query.Where("LOWER(s.shift_name) LIKE ?", search)
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

	var items []models.Shift
	if err := query.Order("s.is_default DESC, s.shift_name ASC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) UpdateShift(ctx context.Context, shift *models.Shift) error {
	return r.db.WithContext(ctx).Save(shift).Error
}

func (r *repository) SoftDeleteShift(ctx context.Context, orgID, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&models.Shift{}).
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", id, orgID).
		Updates(map[string]any{
			"deleted_at": now,
			"status":     "INACTIVE",
			"updated_at": now,
		}).Error
}

func (r *repository) UnsetDefaultShift(ctx context.Context, orgID string) error {
	return r.db.WithContext(ctx).Model(&models.Shift{}).
		Where("organization_id = ? AND is_default = TRUE", orgID).
		Update("is_default", false).Error
}

func (r *repository) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("branches").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE'", branchID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("employee_identities").
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", employeeID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) CreateAssignment(ctx context.Context, a *models.EmployeeShiftAssignment, history *models.EmployeeShiftAssignmentHistory) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		effFromStr := a.EffectiveFrom.Format("2006-01-02")

		// Close open-ended active assignments that began strictly before the new assignment so current shifts stay active until new effectiveFrom - 1 day.
		prevEnd := a.EffectiveFrom.AddDate(0, 0, -1).Format("2006-01-02")
		if err := tx.Model(&models.EmployeeShiftAssignment{}).
			Where("organization_id = ? AND employee_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL", a.OrganizationID, a.EmployeeID).
			Where("effective_from < ? AND (effective_to IS NULL OR effective_to >= ?)", effFromStr, effFromStr).
			Updates(map[string]any{
				"effective_to": prevEnd,
				"updated_at":   now,
			}).Error; err != nil {
			return err
		}

		// Deactivate overlapping assignments starting on or after the new effectiveFrom.
		overlapQuery := tx.Model(&models.EmployeeShiftAssignment{}).
			Where("organization_id = ? AND employee_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL", a.OrganizationID, a.EmployeeID).
			Where("effective_from >= ?", effFromStr)
		if a.EffectiveTo != nil {
			overlapQuery = overlapQuery.Where("effective_from <= ?", a.EffectiveTo.Format("2006-01-02"))
		}
		if err := overlapQuery.Updates(map[string]any{
			"status":     "INACTIVE",
			"updated_at": now,
		}).Error; err != nil {
			return err
		}

		if err := tx.Create(a).Error; err != nil {
			return err
		}

		if history != nil {
			history.AssignmentID = &a.ID
			if err := tx.Create(history).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *repository) FindAssignmentByID(ctx context.Context, orgID, id string) (*models.EmployeeShiftAssignment, error) {
	var a models.EmployeeShiftAssignment
	err := r.db.WithContext(ctx).Table("employee_shift_assignments a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, s.start_time, s.end_time").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("JOIN shifts s ON s.id = a.shift_id").
		Where("a.id = ? AND a.organization_id = ? AND a.deleted_at IS NULL", id, orgID).
		First(&a).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func (r *repository) FindCurrentAssignmentByEmployee(ctx context.Context, orgID, employeeID string, date time.Time) (*models.EmployeeShiftAssignment, error) {
	var a models.EmployeeShiftAssignment
	dateOnly := date.Format("2006-01-02")
	err := r.db.WithContext(ctx).Table("employee_shift_assignments a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, s.start_time, s.end_time").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("JOIN shifts s ON s.id = a.shift_id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.status = 'ACTIVE' AND a.deleted_at IS NULL", orgID, employeeID).
		Where("a.effective_from <= ? AND (a.effective_to IS NULL OR a.effective_to >= ?)", dateOnly, dateOnly).
		Order("a.effective_from DESC").
		First(&a).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func (r *repository) ListAssignments(ctx context.Context, orgID string, q request.ListAssignmentsQuery) ([]models.EmployeeShiftAssignment, int64, error) {
	query := r.db.WithContext(ctx).Table("employee_shift_assignments a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, s.start_time, s.end_time").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("JOIN shifts s ON s.id = a.shift_id").
		Where("a.organization_id = ? AND a.deleted_at IS NULL", orgID)

	if q.EmployeeID != "" {
		query = query.Where("a.employee_id = ?", q.EmployeeID)
	}
	if q.ShiftID != "" {
		query = query.Where("a.shift_id = ?", q.ShiftID)
	}
	if q.Status != "" {
		query = query.Where("LOWER(a.status) = LOWER(?)", q.Status)
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

	var items []models.EmployeeShiftAssignment
	if err := query.Order("a.effective_from DESC, a.created_at DESC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) ListEmployeeAssignments(ctx context.Context, orgID, employeeID string) ([]models.EmployeeShiftAssignment, error) {
	var items []models.EmployeeShiftAssignment
	err := r.db.WithContext(ctx).Table("employee_shift_assignments a").
		Select("a.*, e.employee_code, (e.first_name || ' ' || e.last_name) as employee_name, s.shift_name, s.start_time, s.end_time").
		Joins("JOIN employee_identities e ON e.id = a.employee_id").
		Joins("JOIN shifts s ON s.id = a.shift_id").
		Where("a.organization_id = ? AND a.employee_id = ? AND a.deleted_at IS NULL", orgID, employeeID).
		Order("a.effective_from DESC").
		Scan(&items).Error
	return items, err
}

func (r *repository) ListAssignmentHistory(ctx context.Context, orgID, employeeID string) ([]models.EmployeeShiftAssignmentHistory, error) {
	var items []models.EmployeeShiftAssignmentHistory
	err := r.db.WithContext(ctx).Table("employee_shift_assignment_histories h").
		Select("h.*, s_old.shift_name as old_shift_name, s_new.shift_name as new_shift_name").
		Joins("LEFT JOIN shifts s_old ON s_old.id = h.old_shift_id").
		Joins("LEFT JOIN shifts s_new ON s_new.id = h.new_shift_id").
		Where("h.organization_id = ? AND h.employee_id = ?", orgID, employeeID).
		Order("h.changed_at DESC").
		Scan(&items).Error
	return items, err
}
