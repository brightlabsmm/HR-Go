package models

import "time"

type BranchOperatingHour struct {
	ID             string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string    `gorm:"column:organization_id"`
	BranchID       string    `gorm:"column:branch_id"`
	DayOfWeek      string    `gorm:"column:day_of_week"`
	OpeningTime    *string   `gorm:"column:opening_time"`
	ClosingTime    *string   `gorm:"column:closing_time"`
	IsClosed       bool      `gorm:"column:is_closed"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`
}

func (BranchOperatingHour) TableName() string {
	return "branch_operating_hours"
}
