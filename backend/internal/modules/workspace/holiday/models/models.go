package models

import "time"

type Holiday struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string    `gorm:"type:uuid;not null"`
	BranchID       *string   `gorm:"type:uuid"`
	HolidayName    string    `gorm:"not null"`
	StartDate      time.Time `gorm:"type:date;not null"`
	EndDate        time.Time `gorm:"type:date;not null"`
	HolidayType    string    `gorm:"default:'PUBLIC'"`
	IsPaid         bool      `gorm:"default:true"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time `gorm:"index"`

	BranchName string `gorm:"-"`
}

func (Holiday) TableName() string {
	return "holidays"
}
