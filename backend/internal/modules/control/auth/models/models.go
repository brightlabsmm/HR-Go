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
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code        string `gorm:"uniqueIndex;not null"`
	Name        string `gorm:"not null"`
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Permissions []Permission `gorm:"many2many:platform_role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (PlatformRole) TableName() string {
	return "platform_roles"
}

type Permission struct {
	ID          string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Code        string `gorm:"uniqueIndex;not null"`
	Scope       string `gorm:"not null"` // PLATFORM or ORG
	Resource    string `gorm:"not null"`
	Action      string `gorm:"not null"`
	Description string
	CreatedAt   time.Time
}

func (Permission) TableName() string {
	return "permissions"
}
