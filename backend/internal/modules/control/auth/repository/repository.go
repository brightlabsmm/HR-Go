package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/control/auth/models"
)

type Repository interface {
	FindByEmail(ctx context.Context, email string) (*models.PlatformUser, error)
	FindByID(ctx context.Context, id string) (*models.PlatformUser, error)
	UpdateLastLogin(ctx context.Context, id string) error
	EnsureSuperadmin(ctx context.Context, email, fullName, passwordHash string) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindByEmail(ctx context.Context, email string) (*models.PlatformUser, error) {
	var user models.PlatformUser
	err := r.db.WithContext(ctx).
		Preload("Roles.Permissions").
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

func (r *repository) FindByID(ctx context.Context, id string) (*models.PlatformUser, error) {
	var user models.PlatformUser
	err := r.db.WithContext(ctx).
		Preload("Roles.Permissions").
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

func (r *repository) UpdateLastLogin(ctx context.Context, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.PlatformUser{}).
		Where("id = ?", id).
		Update("last_login_at", &now).Error
}

func (r *repository) EnsureSuperadmin(ctx context.Context, email, fullName, passwordHash string) error {
	var existing models.PlatformUser
	err := r.db.WithContext(ctx).Where("LOWER(email) = LOWER(?)", email).First(&existing).Error
	if err == nil {
		return nil // already exists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	var role models.PlatformRole
	if err := r.db.WithContext(ctx).Where("code = ?", "SUPERADMIN").First(&role).Error; err != nil {
		return err
	}

	user := models.PlatformUser{
		Email:        email,
		FullName:     fullName,
		PasswordHash: passwordHash,
		Status:       "ACTIVE",
		Roles:        []models.PlatformRole{role},
	}
	return r.db.WithContext(ctx).Create(&user).Error
}
