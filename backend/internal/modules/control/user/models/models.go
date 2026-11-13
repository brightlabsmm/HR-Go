package models

import "time"

type PlatformUser struct {
	ID           string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Email        string `gorm:"uniqueIndex;not null"`
	FullName     string `gorm:"not null"`
	PasswordHash string `gorm:"not null"`
	Status       string `gorm:"default:'ACTIVE'"`
	LastLoginAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Roles        []PlatformRole `gorm:"many2many:platform_user_roles;foreignKey:ID;joinForeignKey:PlatformUserID;References:ID;joinReferences:RoleID"`
}

func (PlatformUser) TableName() string {
	return "platform_users"
}

type PlatformRole struct {
	ID   string `gorm:"primaryKey;type:uuid"`
	Code string
	Name string
}

func (PlatformRole) TableName() string {
	return "platform_roles"
}
