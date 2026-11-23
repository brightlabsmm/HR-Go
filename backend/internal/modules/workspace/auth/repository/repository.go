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
	UpdatePassword(ctx context.Context, id string, passwordHash string, mustChangePassword bool) error
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
		Joins("JOIN organizations o ON o.id = organization_accounts.organization_id").
		Where("LOWER(organization_accounts.identifier) = LOWER(?)", identifier).
		Order("o.deleted_at NULLS FIRST").
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

func (r *repository) UpdatePassword(ctx context.Context, id string, passwordHash string, mustChangePassword bool) error {
	return r.db.WithContext(ctx).
		Model(&models.OrganizationAccount{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"password_hash":        passwordHash,
			"must_change_password": mustChangePassword,
			"updated_at":           time.Now().UTC(),
		}).Error
}
