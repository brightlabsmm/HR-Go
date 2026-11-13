package models

import "time"

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
	Organization   Organization     `gorm:"foreignKey:OrganizationID"`
	Employee       EmployeeIdentity `gorm:"foreignKey:EmployeeID"`
	UserRoles      []OrgUserRole    `gorm:"foreignKey:AccountID"`
}

func (OrganizationAccount) TableName() string {
	return "organization_accounts"
}

type Organization struct {
	ID   string `gorm:"primaryKey;type:uuid"`
	Code string
	Name string `gorm:"column:legal_name"`
}

func (Organization) TableName() string {
	return "organizations"
}

type EmployeeIdentity struct {
	ID           string `gorm:"primaryKey;type:uuid"`
	EmployeeCode string
	FirstName    string
	LastName     string
	Email        string
}

func (EmployeeIdentity) TableName() string {
	return "employee_identities"
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

type OrgRole struct {
	ID          string `gorm:"primaryKey;type:uuid"`
	Code        string
	Name        string
	Permissions []Permission `gorm:"many2many:org_role_permissions;foreignKey:ID;joinForeignKey:RoleID;References:ID;joinReferences:PermissionID"`
}

func (OrgRole) TableName() string {
	return "org_roles"
}

type Permission struct {
	ID   string `gorm:"primaryKey;type:uuid"`
	Code string
}

func (Permission) TableName() string {
	return "permissions"
}
