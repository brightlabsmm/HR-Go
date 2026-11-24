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
