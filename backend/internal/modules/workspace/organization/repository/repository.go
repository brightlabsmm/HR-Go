package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/workspace/organization/models"
)

type Repository interface {
	FindByID(ctx context.Context, id string) (*models.Organization, error)
	FindByContactEmail(ctx context.Context, email string) (*models.Organization, error)
	Update(ctx context.Context, org *models.Organization) error
	GetSettings(ctx context.Context, orgID string) (map[string]string, error)
	SaveSetting(ctx context.Context, orgID string, key, value string) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).First(&org, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) FindByContactEmail(ctx context.Context, email string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("LOWER(contact_email) = LOWER(?)", email).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) Update(ctx context.Context, org *models.Organization) error {
	org.UpdatedAt = time.Now().UTC()
	return r.db.WithContext(ctx).Save(org).Error
}

func (r *repository) GetSettings(ctx context.Context, orgID string) (map[string]string, error) {
	var list []models.OrganizationSetting
	err := r.db.WithContext(ctx).Where("organization_id = ?", orgID).Find(&list).Error
	if err != nil {
		return nil, err
	}
	res := make(map[string]string, len(list))
	for _, s := range list {
		res[s.SettingKey] = s.SettingValue
	}
	return res, nil
}

func (r *repository) SaveSetting(ctx context.Context, orgID string, key, value string) error {
	setting := models.OrganizationSetting{
		OrganizationID: orgID,
		SettingKey:     key,
		SettingValue:   value,
		UpdatedAt:      time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "organization_id"}, {Name: "setting_key"}},
		DoUpdates: clause.AssignmentColumns([]string{"setting_value", "updated_at"}),
	}).Create(&setting).Error
}
