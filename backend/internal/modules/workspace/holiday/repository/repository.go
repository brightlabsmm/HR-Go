package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/holiday/models"
	"hrgo/backend/internal/modules/workspace/holiday/request"
)

type Repository interface {
	Create(ctx context.Context, h *models.Holiday) error
	FindByID(ctx context.Context, orgID, id string) (*models.Holiday, error)
	List(ctx context.Context, orgID string, q request.ListHolidaysQuery) ([]models.Holiday, int64, error)
	Update(ctx context.Context, h *models.Holiday) error
	SoftDelete(ctx context.Context, orgID, id string) error
	GetCalendarHolidays(ctx context.Context, orgID string, branchID string, from, to time.Time) ([]models.Holiday, error)
	ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, h *models.Holiday) error {
	return r.db.WithContext(ctx).Create(h).Error
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.Holiday, error) {
	var h models.Holiday
	err := r.db.WithContext(ctx).Table("holidays h").
		Select("h.*, b.name as branch_name").
		Joins("LEFT JOIN branches b ON b.id = h.branch_id").
		Where("h.id = ? AND h.organization_id = ? AND h.deleted_at IS NULL", id, orgID).
		First(&h).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &h, nil
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListHolidaysQuery) ([]models.Holiday, int64, error) {
	query := r.db.WithContext(ctx).Table("holidays h").
		Select("h.*, b.name as branch_name").
		Joins("LEFT JOIN branches b ON b.id = h.branch_id").
		Where("h.organization_id = ? AND h.deleted_at IS NULL", orgID)

	if q.Year > 0 {
		startOfYear := time.Date(q.Year, 1, 1, 0, 0, 0, 0, time.UTC)
		endOfYear := time.Date(q.Year, 12, 31, 23, 59, 59, 0, time.UTC)
		query = query.Where("(h.start_date <= ? AND h.end_date >= ?)", endOfYear, startOfYear)
	}

	if q.BranchID != "" {
		query = query.Where("(h.branch_id = ? OR h.branch_id IS NULL)", q.BranchID)
	}

	if q.StartDate != "" {
		query = query.Where("h.end_date >= ?", q.StartDate)
	}
	if q.EndDate != "" {
		query = query.Where("h.start_date <= ?", q.EndDate)
	}

	if q.HolidayType != "" {
		query = query.Where("LOWER(h.holiday_type) = LOWER(?)", q.HolidayType)
	}

	if q.Q != "" {
		search := "%" + strings.ToLower(strings.TrimSpace(q.Q)) + "%"
		query = query.Where("LOWER(h.holiday_name) LIKE ?", search)
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

	var items []models.Holiday
	if err := query.Order("h.start_date ASC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) Update(ctx context.Context, h *models.Holiday) error {
	return r.db.WithContext(ctx).Save(h).Error
}

func (r *repository) SoftDelete(ctx context.Context, orgID, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&models.Holiday{}).
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", id, orgID).
		Updates(map[string]any{
			"deleted_at": now,
			"updated_at": now,
		}).Error
}

func (r *repository) GetCalendarHolidays(ctx context.Context, orgID string, branchID string, from, to time.Time) ([]models.Holiday, error) {
	query := r.db.WithContext(ctx).Table("holidays h").
		Select("h.*, b.name as branch_name").
		Joins("LEFT JOIN branches b ON b.id = h.branch_id").
		Where("h.organization_id = ? AND h.deleted_at IS NULL", orgID).
		Where("h.start_date <= ? AND h.end_date >= ?", to, from)

	if branchID != "" {
		query = query.Where("(h.branch_id = ? OR h.branch_id IS NULL)", branchID)
	}

	var items []models.Holiday
	err := query.Order("h.start_date ASC").Scan(&items).Error
	return items, err
}

func (r *repository) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("branches").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE'", branchID, orgID).
		Count(&count).Error
	return count > 0, err
}
