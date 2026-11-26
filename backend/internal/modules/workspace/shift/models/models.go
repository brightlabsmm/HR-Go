package models

import "time"

type Shift struct {
	ID             string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string  `gorm:"type:uuid;not null"`
	BranchID       *string `gorm:"type:uuid"`
	ShiftName      string  `gorm:"not null"`
	StartTime      string  `gorm:"not null"` // "09:00"
	EndTime        string  `gorm:"not null"` // "18:00"
	BreakMinutes   int     `gorm:"default:60"`
	Status         string  `gorm:"default:'ACTIVE'"`
	IsDefault      bool    `gorm:"default:false"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time `gorm:"index"`

	BranchName string `gorm:"->;column:branch_name"`
}

func (Shift) TableName() string {
	return "shifts"
}

type EmployeeShiftAssignment struct {
	ID             string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string     `gorm:"type:uuid;not null"`
	EmployeeID     string     `gorm:"type:uuid;not null"`
	ShiftID        string     `gorm:"type:uuid;not null"`
	EffectiveFrom  time.Time  `gorm:"type:date;not null"`
	EffectiveTo    *time.Time `gorm:"type:date"`
	Status         string     `gorm:"default:'ACTIVE'"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time `gorm:"index"`

	EmployeeCode string `gorm:"->;column:employee_code"`
	EmployeeName string `gorm:"->;column:employee_name"`
	ShiftName    string `gorm:"->;column:shift_name"`
	StartTime    string `gorm:"->;column:start_time"`
	EndTime      string `gorm:"->;column:end_time"`
}

func (EmployeeShiftAssignment) TableName() string {
	return "employee_shift_assignments"
}

type EmployeeShiftAssignmentHistory struct {
	ID                 string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID     string     `gorm:"type:uuid;not null"`
	AssignmentID       *string    `gorm:"type:uuid"`
	EmployeeID         string     `gorm:"type:uuid;not null"`
	OldShiftID         *string    `gorm:"type:uuid"`
	NewShiftID         *string    `gorm:"type:uuid"`
	OldEffectiveFrom   *time.Time `gorm:"type:date"`
	OldEffectiveTo     *time.Time `gorm:"type:date"`
	NewEffectiveFrom   *time.Time `gorm:"type:date"`
	NewEffectiveTo     *time.Time `gorm:"type:date"`
	ChangedByAccountID *string    `gorm:"type:uuid"`
	ChangedAt          time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	Reason             *string    `gorm:"type:varchar(255)"`

	OldShiftName string `gorm:"->;column:old_shift_name"`
	NewShiftName string `gorm:"->;column:new_shift_name"`
}

func (EmployeeShiftAssignmentHistory) TableName() string {
	return "employee_shift_assignment_histories"
}
