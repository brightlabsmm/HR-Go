package models

import (
	"time"

	"gorm.io/gorm"
)

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
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

func (Organization) TableName() string {
	return "organizations"
}

type OrganizationSetting struct {
	ID             string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string `gorm:"not null;index"`
	SettingKey     string `gorm:"not null"`
	SettingValue   string `gorm:"not null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (OrganizationSetting) TableName() string {
	return "organization_settings"
}

type EmployeeIdentity struct {
	ID             string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string `gorm:"type:uuid;not null"`
	EmployeeCode   string `gorm:"not null"`
	FirstName      string `gorm:"not null"`
	LastName       string `gorm:"not null"`
	Email          string
	BranchID       *string `gorm:"type:uuid"`
	DepartmentID   *string `gorm:"type:uuid"`
	PositionID     *string `gorm:"type:uuid"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (EmployeeIdentity) TableName() string {
	return "employee_identities"
}

type OrganizationAccount struct {
	ID             string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string `gorm:"type:uuid;not null"`
	EmployeeID     string `gorm:"type:uuid;not null"`
	Identifier     string `gorm:"not null"`
	PasswordHash   string `gorm:"not null"`
	Status         string `gorm:"default:'ACTIVE'"`
	LastLoginAt    *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (OrganizationAccount) TableName() string {
	return "organization_accounts"
}

type OrgUserRole struct {
	AccountID    string  `gorm:"primaryKey;type:uuid"`
	RoleID       string  `gorm:"primaryKey;type:uuid"`
	BranchID     *string `gorm:"type:uuid"`
	DepartmentID *string `gorm:"type:uuid"`
}

func (OrgUserRole) TableName() string {
	return "org_user_roles"
}

type OrgRole struct {
	ID             string  `gorm:"primaryKey;type:uuid"`
	OrganizationID *string `gorm:"type:uuid"`
	Code           string
	Name           string
	Description    string
	IsSystem       bool
}

func (OrgRole) TableName() string {
	return "org_roles"
}

type AdminAccountDetail struct {
	AccountID      string     `gorm:"column:account_id"`
	OrganizationID string     `gorm:"column:organization_id"`
	EmployeeID     string     `gorm:"column:employee_id"`
	Identifier     string     `gorm:"column:identifier"`
	EmployeeCode   string     `gorm:"column:employee_code"`
	FirstName      string     `gorm:"column:first_name"`
	LastName       string     `gorm:"column:last_name"`
	Email          string     `gorm:"column:email"`
	RoleCode       string     `gorm:"column:role_code"`
	RoleName       string     `gorm:"column:role_name"`
	Status         string     `gorm:"column:status"`
	LastLoginAt    *time.Time `gorm:"column:last_login_at"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
}
