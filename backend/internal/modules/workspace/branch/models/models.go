package models

import "time"

type Branch struct {
	ID             string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string  `gorm:"type:uuid;not null"`
	ParentID       *string `gorm:"type:uuid"`
	Code           string  `gorm:"not null"`
	Name           string  `gorm:"not null"`
	Address        string
	Status         string `gorm:"default:'ACTIVE'"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (Branch) TableName() string {
	return "branches"
}
