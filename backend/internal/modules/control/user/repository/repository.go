package repository

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/control/user/models"
	"hrgo/backend/internal/modules/control/user/request"
)

type Repository interface {
	Create(ctx context.Context, u *models.PlatformUser, roleIDs []string) error
	FindByID(ctx context.Context, id string) (*models.PlatformUser, error)
	FindByEmail(ctx context.Context, email string) (*models.PlatformUser, error)
	Update(ctx context.Context, u *models.PlatformUser) error
	ReplaceRoles(ctx context.Context, userID string, roleIDs []string) error
	List(ctx context.Context, q request.ListUsersQuery) ([]models.PlatformUser, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, u *models.PlatformUser, roleIDs []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(u).Error; err != nil {
			return err
		}
		var roles []models.PlatformRole
		if err := tx.Where("id IN ?", roleIDs).Find(&roles).Error; err != nil {
			return err
		}
		return tx.Model(u).Association("Roles").Replace(roles)
	})
}

func (r *repository) FindByID(ctx context.Context, id string) (*models.PlatformUser, error) {
	var user models.PlatformUser
	err := r.db.WithContext(ctx).
		Preload("Roles").
		Where("id = ?", id).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *repository) FindByEmail(ctx context.Context, email string) (*models.PlatformUser, error) {
	var user models.PlatformUser
	err := r.db.WithContext(ctx).
		Where("LOWER(email) = LOWER(?)", email).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *repository) Update(ctx context.Context, u *models.PlatformUser) error {
	return r.db.WithContext(ctx).Save(u).Error
}

func (r *repository) ReplaceRoles(ctx context.Context, userID string, roleIDs []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.PlatformUser
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			return err
		}
		var roles []models.PlatformRole
		if err := tx.Where("id IN ?", roleIDs).Find(&roles).Error; err != nil {
			return err
		}
		return tx.Model(&user).Association("Roles").Replace(roles)
	})
}

func (r *repository) List(ctx context.Context, q request.ListUsersQuery) ([]models.PlatformUser, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.PlatformUser{})
	if term := strings.TrimSpace(q.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?", like, like)
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

	var list []models.PlatformUser
	err := db.Preload("Roles").
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	return list, total, err
}
