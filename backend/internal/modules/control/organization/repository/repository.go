package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/request"
)

type Repository interface {
	Create(ctx context.Context, org *models.Organization) error
	FindByID(ctx context.Context, id string) (*models.Organization, error)
	FindByCode(ctx context.Context, code string) (*models.Organization, error)
	Update(ctx context.Context, org *models.Organization) error
	List(ctx context.Context, q request.ListOrganizationsQuery) ([]models.Organization, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Create(org).Error
}

func (r *repository) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) FindByCode(ctx context.Context, code string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("LOWER(code) = LOWER(?)", code).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) Update(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Save(org).Error
}

func (r *repository) List(ctx context.Context, query request.ListOrganizationsQuery) ([]models.Organization, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Organization{})

	if term := strings.TrimSpace(query.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(legal_name) LIKE ? OR LOWER(display_name) LIKE ? OR LOWER(code) LIKE ?", like, like, like)
	}
	if code := strings.TrimSpace(query.OrganizationCode); code != "" {
		db = db.Where("LOWER(code) = LOWER(?)", code)
	}
	if status := strings.TrimSpace(query.Status); status != "" {
		db = db.Where("status = ?", status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	sortBy := "created_at"
	switch strings.ToLower(query.SortBy) {
	case "code":
		sortBy = "code"
	case "legalname":
		sortBy = "legal_name"
	case "status":
		sortBy = "status"
	}

	orderDir := "DESC"
	if strings.EqualFold(query.SortDirection, "ASC") {
		orderDir = "ASC"
	}

	var list []models.Organization
	err := db.Order(fmt.Sprintf("%s %s", sortBy, orderDir)).
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
