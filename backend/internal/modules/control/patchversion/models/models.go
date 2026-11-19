package models

import "time"

// ApplicationPatchVersion is one recorded application patch version.
// PatchVersion is exactly 00.00.00. Only one row has IsCurrent true.
type ApplicationPatchVersion struct {
	ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	PatchVersion  string    `gorm:"column:patch_version;type:varchar(8);not null"`
	PatchDateTime time.Time `gorm:"column:patch_date_time;not null"`
	IsCurrent     bool      `gorm:"column:is_current;not null;default:false"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (ApplicationPatchVersion) TableName() string {
	return "application_patch_versions"
}
