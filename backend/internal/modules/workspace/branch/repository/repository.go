package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/branch/models"
	"hrgo/backend/internal/modules/workspace/branch/request"
)

type Repository interface {
	Create(ctx context.Context, b *models.Branch) error
	FindByID(ctx context.Context, orgID, id string) (*models.Branch, error)
	FindByCode(ctx context.Context, orgID, code string) (*models.Branch, error)
	Update(ctx context.Context, b *models.Branch) error
	List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]models.Branch, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, b *models.Branch) error {
	return r.db.WithContext(ctx).Create(b).Error
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.Branch, error) {
	var b models.Branch
	err := r.db.WithContext(ctx).Where("organization_id = ? AND id = ?", orgID, id).First(&b).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func (r *repository) FindByCode(ctx context.Context, orgID, code string) (*models.Branch, error) {
	var b models.Branch
	err := r.db.WithContext(ctx).Where("organization_id = ? AND LOWER(code) = LOWER(?)", orgID, code).First(&b).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func (r *repository) Update(ctx context.Context, b *models.Branch) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]models.Branch, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Branch{}).Where("organization_id = ?", orgID)

	if term := strings.TrimSpace(q.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(code) LIKE ?", like, like)
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

	var list []models.Branch
	err := db.Order(fmt.Sprintf("%s %s", sortBy, orderDir)).
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	return list, total, err
}
