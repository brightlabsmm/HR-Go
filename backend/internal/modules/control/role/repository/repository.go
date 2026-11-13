package repository

import (
	"context"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/control/role/models"
	"hrgo/backend/internal/modules/control/role/request"
)

type Repository interface {
	ListRoles(ctx context.Context) ([]models.PlatformRole, error)
	ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]models.Permission, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) ListRoles(ctx context.Context) ([]models.PlatformRole, error) {
	var roles []models.PlatformRole
	err := r.db.WithContext(ctx).
		Preload("Permissions").
		Order("name ASC").
		Find(&roles).Error
	return roles, err
}

func (r *repository) ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]models.Permission, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Permission{})
	if q.Scope != "" {
		db = db.Where("scope = ?", q.Scope)
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
		pageSize = 50
	}
	offset := (page - 1) * pageSize

	var perms []models.Permission
	err := db.Order("resource ASC, action ASC").
		Limit(pageSize).
		Offset(offset).
		Find(&perms).Error
	return perms, total, err
}
