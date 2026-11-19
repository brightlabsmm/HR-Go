package models

import "time"

type Department struct {
	ID             string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string  `gorm:"type:uuid;not null"`
	BranchID       *string `gorm:"type:uuid"`
	Code           string  `gorm:"not null"`
	Name           string  `gorm:"not null"`
	Status         string  `gorm:"default:'ACTIVE'"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (Department) TableName() string {
	return "departments"
}
