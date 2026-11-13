package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/position/models"
	"hrgo/backend/internal/modules/workspace/position/request"
)

type Repository interface {
	Create(ctx context.Context, p *models.Position) error
	FindByID(ctx context.Context, orgID, id string) (*models.Position, error)
	FindByCode(ctx context.Context, orgID, code string) (*models.Position, error)
	DepartmentExists(ctx context.Context, orgID, departmentID string) (bool, error)
	Update(ctx context.Context, p *models.Position) error
	List(ctx context.Context, orgID string, q request.ListPositionsQuery) ([]models.Position, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, p *models.Position) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.Position, error) {
	var p models.Position
	err := r.db.WithContext(ctx).Where("organization_id = ? AND id = ?", orgID, id).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *repository) FindByCode(ctx context.Context, orgID, code string) (*models.Position, error) {
	var p models.Position
	err := r.db.WithContext(ctx).Where("organization_id = ? AND LOWER(code) = LOWER(?)", orgID, code).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *repository) DepartmentExists(ctx context.Context, orgID, departmentID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("departments").
		Where("organization_id = ? AND id = ?", orgID, departmentID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) Update(ctx context.Context, p *models.Position) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListPositionsQuery) ([]models.Position, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Position{}).Where("organization_id = ?", orgID)

	if term := strings.TrimSpace(q.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(code) LIKE ?", like, like)
	}
	if q.DepartmentID != nil && *q.DepartmentID != "" {
		db = db.Where("department_id = ?", *q.DepartmentID)
	}
	if status := strings.TrimSpace(q.Status); status != "" {
		db = db.Where("status = ?", status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	sortBy := "created_at"
	if strings.EqualFold(q.SortBy, "name") {
		sortBy = "name"
	} else if strings.EqualFold(q.SortBy, "code") {
		sortBy = "code"
	}

	orderDir := "DESC"
	if strings.EqualFold(q.SortDirection, "ASC") {
		orderDir = "ASC"
	}

	var list []models.Position
	err := db.Order(fmt.Sprintf("%s %s", sortBy, orderDir)).
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	return list, total, err
}
