package models

import "time"

type AttendanceRecord struct {
	ID                string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID    string    `gorm:"type:uuid;not null"`
	EmployeeID        string    `gorm:"type:uuid;not null"`
	ShiftID           *string   `gorm:"type:uuid"`
	AttendanceDate    time.Time `gorm:"type:date;not null"`
	CheckIn           *time.Time
	CheckOut          *time.Time
	AttendanceStatus  string  `gorm:"default:'PRESENT'"`
	LateMinutes       int     `gorm:"default:0"`
	EarlyLeaveMinutes int     `gorm:"default:0"`
	WorkedMinutes     int     `gorm:"default:0"`
	Source            string  `gorm:"default:'WEB'"`
	Remarks           *string `gorm:"type:text"`
	CreatedAt         time.Time
	UpdatedAt         time.Time

	EmployeeCode   string `gorm:"-"`
	EmployeeName   string `gorm:"-"`
	ShiftName      string `gorm:"-"`
	BranchName     string `gorm:"-"`
	DepartmentName string `gorm:"-"`
}

func (AttendanceRecord) TableName() string {
	return "attendance_records"
}

type AttendanceCorrectionRequest struct {
	ID                  string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID      string    `gorm:"type:uuid;not null"`
	AttendanceID        *string   `gorm:"type:uuid"`
	EmployeeID          string    `gorm:"type:uuid;not null"`
	AttendanceDate      time.Time `gorm:"type:date;not null"`
	RequestedCheckIn    *time.Time
	RequestedCheckOut   *time.Time
	Reason              string  `gorm:"type:text;not null"`
	RequestStatus       string  `gorm:"default:'PENDING'"`
	ReviewedByAccountID *string `gorm:"type:uuid"`
	ReviewedAt          *time.Time
	RejectionReason     *string `gorm:"type:text"`
	CreatedAt           time.Time
	UpdatedAt           time.Time

	EmployeeCode string `gorm:"-"`
	EmployeeName string `gorm:"-"`
	ReviewerName string `gorm:"-"`
}

func (AttendanceCorrectionRequest) TableName() string {
	return "attendance_correction_requests"
}
