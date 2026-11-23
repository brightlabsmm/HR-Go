package models

import "time"

type OrganizationAccount struct {
	ID                 string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID     string `gorm:"type:uuid;not null"`
	EmployeeID         string `gorm:"type:uuid;not null"`
	Identifier         string `gorm:"not null"`
	PasswordHash       string `gorm:"not null"`
	Status             string `gorm:"default:'ACTIVE'"`
	MustChangePassword bool   `gorm:"column:must_change_password;default:true"`
	LastLoginAt        *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
	Employee           EmployeeIdentity `gorm:"foreignKey:EmployeeID"`
	UserRoles          []OrgUserRole    `gorm:"foreignKey:AccountID"`
}

func (OrganizationAccount) TableName() string {
	return "organization_accounts"
}

type EmployeeIdentity struct {
	ID             string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string `gorm:"type:uuid;not null"`
	EmployeeCode   string `gorm:"not null"`
	FirstName      string `gorm:"not null"`
	LastName       string `gorm:"not null"`
	Email          string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (EmployeeIdentity) TableName() string {
	return "employee_identities"
}

type OrgRole struct {
	ID   string `gorm:"primaryKey;type:uuid"`
	Code string
	Name string
}

func (OrgRole) TableName() string {
	return "org_roles"
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
