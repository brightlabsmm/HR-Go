package models

import "time"

type OvertimeCategory struct {
	ID             string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string     `gorm:"column:organization_id"`
	Code           string     `gorm:"column:code"`
	Name           string     `gorm:"column:name"`
	Description    *string    `gorm:"column:description"`
	RateMultiplier float64    `gorm:"column:rate_multiplier"`
	Status         string     `gorm:"column:status"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at"`
	DeletedAt      *time.Time `gorm:"column:deleted_at"`
}

func (OvertimeCategory) TableName() string { return "overtime_categories" }

type OvertimeRule struct {
	ID                  string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID      string    `gorm:"column:organization_id"`
	OvertimeCategoryID  string    `gorm:"column:overtime_category_id"`
	MinMinutes          int       `gorm:"column:min_minutes"`
	MaxDailyMinutes     int       `gorm:"column:max_daily_minutes"`
	RequiresPreApproval bool      `gorm:"column:requires_pre_approval"`
	CreatedAt           time.Time `gorm:"column:created_at"`
	UpdatedAt           time.Time `gorm:"column:updated_at"`
}

func (OvertimeRule) TableName() string { return "overtime_rules" }

type OvertimeRequest struct {
	ID                 string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID     string    `gorm:"column:organization_id"`
	EmployeeID         string    `gorm:"column:employee_id"`
	OvertimeCategoryID string    `gorm:"column:overtime_category_id"`
	WorkDate           time.Time `gorm:"column:work_date;type:date"`
	StartTime          string    `gorm:"column:start_time"`
	EndTime            string    `gorm:"column:end_time"`
	RequestedMinutes   int       `gorm:"column:requested_minutes"`
	Reason             string    `gorm:"column:reason"`
	RequestStatus      string    `gorm:"column:request_status"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`

	EmployeeCode  string  `gorm:"->;column:employee_code"`
	EmployeeName  string  `gorm:"->;column:employee_name"`
	CategoryCode  string  `gorm:"->;column:category_code"`
	CategoryName  string  `gorm:"->;column:category_name"`
	Multiplier    float64 `gorm:"->;column:multiplier"`
	DecisionNotes *string `gorm:"->;column:decision_notes"`
}

func (OvertimeRequest) TableName() string { return "overtime_requests" }

type OvertimeApproval struct {
	ID                string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID    string    `gorm:"column:organization_id"`
	OvertimeRequestID string    `gorm:"column:overtime_request_id"`
	ApproverAccountID *string   `gorm:"column:approver_account_id"`
	Decision          string    `gorm:"column:decision"`
	Remarks           *string   `gorm:"column:remarks"`
	DecidedAt         time.Time `gorm:"column:decided_at"`
}

func (OvertimeApproval) TableName() string { return "overtime_approvals" }

type OvertimeEntry struct {
	ID                 string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID     string    `gorm:"column:organization_id"`
	OvertimeRequestID  string    `gorm:"column:overtime_request_id"`
	EmployeeID         string    `gorm:"column:employee_id"`
	OvertimeCategoryID string    `gorm:"column:overtime_category_id"`
	WorkDate           time.Time `gorm:"column:work_date;type:date"`
	ApprovedMinutes    int       `gorm:"column:approved_minutes"`
	Multiplier         float64   `gorm:"column:multiplier"`
	CreatedAt          time.Time `gorm:"column:created_at"`
}

func (OvertimeEntry) TableName() string { return "overtime_entries" }
