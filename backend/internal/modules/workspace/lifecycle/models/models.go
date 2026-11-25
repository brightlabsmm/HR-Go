package models

import (
	"encoding/json"
	"time"
)

type EmploymentContract struct {
	ID             string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string     `gorm:"column:organization_id"`
	EmployeeID     string     `gorm:"column:employee_id"`
	ContractType   string     `gorm:"column:contract_type"`
	StartDate      time.Time  `gorm:"column:start_date;type:date"`
	EndDate        *time.Time `gorm:"column:end_date;type:date"`
	ContractStatus string     `gorm:"column:contract_status"`
	Notes          *string    `gorm:"column:notes"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at"`
	DeletedAt      *time.Time `gorm:"column:deleted_at"`
}

func (EmploymentContract) TableName() string {
	return "employment_contracts"
}

type EmployeeDocument struct {
	ID             string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string     `gorm:"column:organization_id"`
	EmployeeID     string     `gorm:"column:employee_id"`
	DocumentType   string     `gorm:"column:document_type"`
	DocumentName   string     `gorm:"column:document_name"`
	FileReference  string     `gorm:"column:file_reference"`
	ExpiryDate     *time.Time `gorm:"column:expiry_date;type:date"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at"`
	DeletedAt      *time.Time `gorm:"column:deleted_at"`
}

func (EmployeeDocument) TableName() string {
	return "employee_documents"
}

type EmployeeServiceYear struct {
	ID              string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID  string    `gorm:"column:organization_id"`
	EmployeeID      string    `gorm:"column:employee_id"`
	CalculationDate time.Time `gorm:"column:calculation_date;type:date"`
	ServiceYears    float64   `gorm:"column:service_years"`
	CreatedAt       time.Time `gorm:"column:created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at"`
}

func (EmployeeServiceYear) TableName() string {
	return "employee_service_years"
}

type EmployeeExitRecord struct {
	ID                  string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID      string    `gorm:"column:organization_id"`
	EmployeeID          string    `gorm:"column:employee_id"`
	RecordedByAccountID *string   `gorm:"column:recorded_by_account_id"`
	ExitType            string    `gorm:"column:exit_type"`
	EffectiveDate       time.Time `gorm:"column:effective_date;type:date"`
	Reason              *string   `gorm:"column:reason"`
	DecisionStatus      string    `gorm:"column:decision_status"`
	RecordedAt          time.Time `gorm:"column:recorded_at"`
	CreatedAt           time.Time `gorm:"column:created_at"`
	UpdatedAt           time.Time `gorm:"column:updated_at"`
}

func (EmployeeExitRecord) TableName() string {
	return "employee_exit_records"
}

type EmployeeHistory struct {
	ID                 string          `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID     string          `gorm:"column:organization_id"`
	EmployeeID         string          `gorm:"column:employee_id"`
	ExitRecordID       *string         `gorm:"column:exit_record_id"`
	EmployeeSnapshot   json.RawMessage `gorm:"column:employee_snapshot;type:jsonb"`
	ProfileSnapshot    json.RawMessage `gorm:"column:profile_snapshot;type:jsonb"`
	SnapshotReason     string          `gorm:"column:snapshot_reason"`
	SnapshotAt         time.Time       `gorm:"column:snapshot_at"`
	CreatedByAccountID *string         `gorm:"column:created_by_account_id"`
}

func (EmployeeHistory) TableName() string {
	return "employee_histories"
}
