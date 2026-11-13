package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/auth/models"
)

type Repository interface {
	FindByIdentifier(ctx context.Context, identifier string) (*models.OrganizationAccount, error)
	FindByID(ctx context.Context, id string) (*models.OrganizationAccount, error)
	UpdateLastLogin(ctx context.Context, id string) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindByIdentifier(ctx context.Context, identifier string) (*models.OrganizationAccount, error) {
	var acc models.OrganizationAccount
	err := r.db.WithContext(ctx).
		Preload("Organization").
		Preload("Employee").
		Preload("UserRoles.Role.Permissions").
		Where("LOWER(identifier) = LOWER(?)", identifier).
		First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) FindByID(ctx context.Context, id string) (*models.OrganizationAccount, error) {
	var acc models.OrganizationAccount
	err := r.db.WithContext(ctx).
		Preload("Organization").
		Preload("Employee").
		Preload("UserRoles.Role.Permissions").
		Where("id = ?", id).
		First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) UpdateLastLogin(ctx context.Context, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.OrganizationAccount{}).
		Where("id = ?", id).
		Update("last_login_at", &now).Error
}
