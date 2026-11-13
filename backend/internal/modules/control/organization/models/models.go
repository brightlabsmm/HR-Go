package models

import "time"

type Organization struct {
	ID           string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code         string `gorm:"uniqueIndex;not null"`
	LegalName    string `gorm:"not null"`
	DisplayName  string `gorm:"not null"`
	ContactEmail string
	ContactPhone string
	Country      string `gorm:"default:'MM'"`
	Address      string
	Status       string `gorm:"default:'PENDING'"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (Organization) TableName() string {
	return "organizations"
}
