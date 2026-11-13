package models

import "time"

type OrgRole struct {
	ID             string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID *string `gorm:"type:uuid"`
	Code           string  `gorm:"not null"`
	Name           string  `gorm:"not null"`
	Description    string
	IsSystem       bool `gorm:"default:false"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	Permissions    []Permission `gorm:"many2many:org_role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (OrgRole) TableName() string {
	return "org_roles"
}

type Permission struct {
	ID          string `gorm:"primaryKey;type:uuid"`
	Code        string `gorm:"uniqueIndex;not null"`
	Scope       string `gorm:"not null"`
	Resource    string `gorm:"not null"`
	Action      string `gorm:"not null"`
	Description string
	CreatedAt   time.Time
}

func (Permission) TableName() string {
	return "permissions"
}

type OrgUserRole struct {
	AccountID    string  `gorm:"primaryKey;type:uuid"`
	RoleID       string  `gorm:"primaryKey;type:uuid"`
	BranchID     *string `gorm:"type:uuid"`
	DepartmentID *string `gorm:"type:uuid"`
	Role         OrgRole `gorm:"foreignKey:RoleID"`
}

func (OrgUserRole) TableName() string {
	return "org_user_roles"
}
