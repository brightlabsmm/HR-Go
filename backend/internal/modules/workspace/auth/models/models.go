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
	Organization       Organization     `gorm:"foreignKey:OrganizationID"`
	Employee           EmployeeIdentity `gorm:"foreignKey:EmployeeID"`
	UserRoles          []OrgUserRole    `gorm:"foreignKey:AccountID"`
}

func (OrganizationAccount) TableName() string {
	return "organization_accounts"
}

type Organization struct {
	ID                 string `gorm:"primaryKey;type:uuid"`
	Code               string
	LegalName          string     `gorm:"column:legal_name"`
	DisplayName        string     `gorm:"column:display_name"`
	Status             string     `gorm:"column:status"`
	DeletedAt          *time.Time `gorm:"column:deleted_at"`
	SuspendNotifyFrom  *time.Time `gorm:"column:suspend_notify_from"`
	SuspendNotifyTo    *time.Time `gorm:"column:suspend_notify_to"`
	ScheduledSuspendAt *time.Time `gorm:"column:scheduled_suspend_at"`
	SuspendReason      *string    `gorm:"column:suspend_reason"`
	SuspendedAt        *time.Time `gorm:"column:suspended_at"`
	SessionsRevokedAt  *time.Time `gorm:"column:sessions_revoked_at"`
}

func (Organization) TableName() string {
	return "organizations"
}

type WorkspaceSession struct {
	ID             string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string     `gorm:"type:uuid;not null"`
	AccountID      string     `gorm:"type:uuid;not null"`
	IPAddress      *string    `gorm:"column:ip_address"`
	UserAgent      *string    `gorm:"column:user_agent"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	ExpiresAt      time.Time  `gorm:"column:expires_at"`
	RevokedAt      *time.Time `gorm:"column:revoked_at"`
	RevokedReason  *string    `gorm:"column:revoked_reason"`
}

func (WorkspaceSession) TableName() string {
	return "workspace_sessions"
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
