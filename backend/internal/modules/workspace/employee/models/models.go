package models

import "time"

type Employee struct {
	ID               string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID   string     `gorm:"type:uuid;not null"`
	EmployeeCode     string     `gorm:"not null"`
	FirstName        string     `gorm:"not null"`
	LastName         string     `gorm:"not null"`
	Email            *string    `gorm:"type:varchar(255)"`
	Phone            *string    `gorm:"type:varchar(50)"`
	BranchID         *string    `gorm:"type:uuid"`
	DepartmentID     *string    `gorm:"type:uuid"`
	PositionID       *string    `gorm:"type:uuid"`
	DateOfJoining    *time.Time `gorm:"type:date"`
	EmploymentStatus string     `gorm:"default:'ACTIVE'"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        *time.Time `gorm:"index"`

	// Relational metadata populated when loaded with joins/preloads
	BranchName     string  `gorm:"-"`
	DepartmentName string  `gorm:"-"`
	PositionTitle  string  `gorm:"-"`
	RoleID         *string `gorm:"-"`
	RoleName       *string `gorm:"-"`
	RoleCode       *string `gorm:"-"`
}

func (Employee) TableName() string {
	return "employee_identities"
}

type EmployeeProfile struct {
	ID               string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID   string     `gorm:"type:uuid;not null"`
	EmployeeID       string     `gorm:"type:uuid;not null;uniqueIndex"`
	DateOfBirth      *time.Time `gorm:"type:date"`
	Gender           *string    `gorm:"type:varchar(20)"`
	Nationality      *string    `gorm:"type:varchar(50)"`
	MaritalStatus    *string    `gorm:"type:varchar(20)"`
	Address          *string    `gorm:"type:text"`
	EmergencyContact *string    `gorm:"type:varchar(255)"`
	ProfileData      string     `gorm:"type:jsonb;default:'{}'"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func (EmployeeProfile) TableName() string {
	return "employee_profiles"
}

type EmployeePositionHistory struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string    `gorm:"type:uuid;not null"`
	EmployeeID     string    `gorm:"type:uuid;not null"`
	OldPositionID  *string   `gorm:"type:uuid"`
	NewPositionID  string    `gorm:"type:uuid;not null"`
	EffectiveDate  time.Time `gorm:"type:date;not null"`
	Remarks        *string   `gorm:"type:text"`
	CreatedAt      time.Time

	OldPositionTitle *string `gorm:"-"`
	NewPositionTitle string  `gorm:"-"`
}

func (EmployeePositionHistory) TableName() string {
	return "employee_position_histories"
}

type OrganizationAccount struct {
	ID                 string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID     string `gorm:"type:uuid;not null"`
	EmployeeID         string `gorm:"type:uuid;not null"`
	Identifier         string `gorm:"not null"`
	PasswordHash       string `gorm:"not null"`
	Status             string `gorm:"default:'ACTIVE'"`
	MustChangePassword bool   `gorm:"column:must_change_password;default:true"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func (OrganizationAccount) TableName() string {
	return "organization_accounts"
}
