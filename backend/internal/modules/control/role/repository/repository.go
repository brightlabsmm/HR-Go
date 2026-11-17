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
	ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) (*models.PlatformRole, error)
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
		Preload("Permissions", func(db *gorm.DB) *gorm.DB {
			return db.Order("grouping ASC, resource ASC, action ASC")
		}).
		Order("name ASC").
		Find(&roles).Error
	return roles, err
}

func (r *repository) ListPermissions(ctx context.Context, q request.ListPermissionsQuery) ([]models.Permission, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Permission{})
	if q.Scope != "" {
		db = db.Where("scope = ?", q.Scope)
	}
	if q.Grouping != "" {
		db = db.Where("grouping = ?", q.Grouping)
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
	err := db.Order("grouping ASC, resource ASC, action ASC").
		Limit(pageSize).
		Offset(offset).
		Find(&perms).Error
	return perms, total, err
}

func (r *repository) ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) (*models.PlatformRole, error) {
	var role models.PlatformRole
	if err := r.db.WithContext(ctx).Where("id = ?", roleID).First(&role).Error; err != nil {
		return nil, err
	}

	var permissions []models.Permission
	if len(permissionIDs) > 0 {
		if err := r.db.WithContext(ctx).Where("id IN ?", permissionIDs).Find(&permissions).Error; err != nil {
			return nil, err
		}
	}

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Model(&role).Association("Permissions").Replace(permissions)
	})
	if err != nil {
		return nil, err
	}

	if err := r.db.WithContext(ctx).
		Preload("Permissions", func(db *gorm.DB) *gorm.DB {
			return db.Order("grouping ASC, resource ASC, action ASC")
		}).
		First(&role, "id = ?", roleID).Error; err != nil {
		return nil, err
	}

	return &role, nil
}
