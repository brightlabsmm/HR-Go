package models

import (
	"encoding/json"
	"time"
)

type AttendanceImportBatch struct {
	ID                  string          `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID      string          `gorm:"column:organization_id"`
	ImportedByAccountID *string         `gorm:"column:imported_by_account_id"`
	FileReference       string          `gorm:"column:file_reference"`
	TotalRows           int             `gorm:"column:total_rows"`
	SuccessRows         int             `gorm:"column:success_rows"`
	FailedRows          int             `gorm:"column:failed_rows"`
	ImportStatus        string          `gorm:"column:import_status"`
	ErrorSummary        json.RawMessage `gorm:"column:error_summary;type:jsonb"`
	CreatedAt           time.Time       `gorm:"column:created_at"`
	UpdatedAt           time.Time       `gorm:"column:updated_at"`
}

func (AttendanceImportBatch) TableName() string {
	return "attendance_import_batches"
}
