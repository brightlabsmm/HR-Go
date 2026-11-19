package models

import (
	"time"

	"gorm.io/gorm"
)

type Organization struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string         `gorm:"column:code"`
	LegalName    string         `gorm:"column:legal_name"`
	DisplayName  string         `gorm:"column:display_name"`
	ContactEmail *string        `gorm:"column:contact_email"`
	ContactPhone *string        `gorm:"column:contact_phone"`
	Country      *string        `gorm:"column:country"`
	Address      *string        `gorm:"column:address"`
	Status       string         `gorm:"column:status"`
	CreatedAt    time.Time      `gorm:"column:created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"column:deleted_at;index"`
}

func (Organization) TableName() string {
	return "organizations"
}

type OrganizationSetting struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string    `gorm:"column:organization_id"`
	SettingKey     string    `gorm:"column:setting_key"`
	SettingValue   string    `gorm:"column:setting_value"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`
}

func (OrganizationSetting) TableName() string {
	return "organization_settings"
}
