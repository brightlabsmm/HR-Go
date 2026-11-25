package models

import "time"

type MobileDevice struct {
	ID                    string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID        string  `gorm:"type:uuid;not null"`
	OrganizationAccountID string  `gorm:"type:uuid;not null"`
	DeviceIdentifier      string  `gorm:"type:varchar(255);not null"`
	DeviceName            *string `gorm:"type:varchar(255)"`
	Status                string  `gorm:"type:varchar(30);default:'ACTIVE'"`
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

func (MobileDevice) TableName() string {
	return "mobile_devices"
}

type OfflineAttendanceEvent struct {
	ID             string     `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OrganizationID string     `gorm:"type:uuid;not null"`
	EmployeeID     string     `gorm:"type:uuid;not null"`
	LocalEventID   string     `gorm:"type:varchar(100);not null"`
	EventType      string     `gorm:"type:varchar(30);not null"`
	LocalEventTime time.Time  `gorm:"type:timestamptz;not null"`
	SyncStatus     string     `gorm:"type:varchar(30);default:'PENDING'"`
	SyncedAt       *time.Time `gorm:"type:timestamptz"`
	CreatedAt      time.Time
}

func (OfflineAttendanceEvent) TableName() string {
	return "offline_attendance_events"
}

type SynchronizationResult struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OfflineEventID string    `gorm:"type:uuid;not null"`
	ResultStatus   string    `gorm:"type:varchar(30);not null"`
	ErrorMessage   *string   `gorm:"type:text"`
	ProcessedAt    time.Time `gorm:"type:timestamptz;default:CURRENT_TIMESTAMP"`
}

func (SynchronizationResult) TableName() string {
	return "synchronization_results"
}

// MobileCorrectionRow represents a joined attendance correction query row with explicit column bindings.
type MobileCorrectionRow struct {
	ID                  string     `gorm:"column:id"`
	OrganizationID      string     `gorm:"column:organization_id"`
	AttendanceID        *string    `gorm:"column:attendance_id"`
	EmployeeID          string     `gorm:"column:employee_id"`
	EmployeeCode        string     `gorm:"column:employee_code"`
	EmployeeName        string     `gorm:"column:employee_name"`
	AttendanceDate      time.Time  `gorm:"column:attendance_date"`
	RequestedCheckIn    *time.Time `gorm:"column:requested_check_in"`
	RequestedCheckOut   *time.Time `gorm:"column:requested_check_out"`
	OriginalCheckIn     *time.Time `gorm:"column:original_check_in"`
	OriginalCheckOut    *time.Time `gorm:"column:original_check_out"`
	Reason              string     `gorm:"column:reason"`
	RequestStatus       string     `gorm:"column:request_status"`
	ReviewedByAccountID *string    `gorm:"column:reviewed_by_account_id"`
	ReviewerName        *string    `gorm:"column:reviewer_name"`
	ReviewedAt          *time.Time `gorm:"column:reviewed_at"`
	RejectionReason     *string    `gorm:"column:rejection_reason"`
	CreatedAt           time.Time  `gorm:"column:created_at"`
	UpdatedAt           time.Time  `gorm:"column:updated_at"`
}
