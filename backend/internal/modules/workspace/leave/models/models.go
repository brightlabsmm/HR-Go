package models

import "time"

type LeaveType struct {
	ID              string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID  string     `gorm:"column:organization_id"`
	Code            string     `gorm:"column:code"`
	Name            string     `gorm:"column:name"`
	Description     *string    `gorm:"column:description"`
	IsPaid          bool       `gorm:"column:is_paid"`
	RequiresBalance bool       `gorm:"column:requires_balance"`
	AnnualAllowance float64    `gorm:"column:annual_allowance"`
	Status          string     `gorm:"column:status"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`
	DeletedAt       *time.Time `gorm:"column:deleted_at"`
}

func (LeaveType) TableName() string { return "leave_types" }

type LeaveRule struct {
	ID                 string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID     string    `gorm:"column:organization_id"`
	LeaveTypeID        string    `gorm:"column:leave_type_id"`
	MinNoticeDays      int       `gorm:"column:min_notice_days"`
	MaxConsecutiveDays *int      `gorm:"column:max_consecutive_days"`
	AllowHalfDay       bool      `gorm:"column:allow_half_day"`
	CarryOverLimit     float64   `gorm:"column:carry_over_limit"`
	CreatedAt          time.Time `gorm:"column:created_at"`
	UpdatedAt          time.Time `gorm:"column:updated_at"`
}

func (LeaveRule) TableName() string { return "leave_rules" }

type LeaveBalance struct {
	ID             string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string    `gorm:"column:organization_id"`
	EmployeeID     string    `gorm:"column:employee_id"`
	LeaveTypeID    string    `gorm:"column:leave_type_id"`
	BalanceYear    int       `gorm:"column:balance_year"`
	AllocatedDays  float64   `gorm:"column:allocated_days"`
	UsedDays       float64   `gorm:"column:used_days"`
	PendingDays    float64   `gorm:"column:pending_days"`
	RemainingDays  float64   `gorm:"column:remaining_days"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`

	LeaveTypeName   string `gorm:"->;column:leave_type_name"`
	LeaveTypeCode   string `gorm:"->;column:leave_type_code"`
	RequiresBalance bool   `gorm:"->;column:requires_balance"`
	EmployeeCode    string `gorm:"->;column:employee_code"`
	EmployeeName    string `gorm:"->;column:employee_name"`
}

func (LeaveBalance) TableName() string { return "leave_balances" }

type LeaveRequest struct {
	ID             string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID string    `gorm:"column:organization_id"`
	EmployeeID     string    `gorm:"column:employee_id"`
	LeaveTypeID    string    `gorm:"column:leave_type_id"`
	StartDate      time.Time `gorm:"column:start_date;type:date"`
	EndDate        time.Time `gorm:"column:end_date;type:date"`
	IsHalfDay      bool      `gorm:"column:is_half_day"`
	RequestedDays  float64   `gorm:"column:requested_days"`
	Reason         string    `gorm:"column:reason"`
	RequestStatus  string    `gorm:"column:request_status"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at"`

	EmployeeCode  string  `gorm:"->;column:employee_code"`
	EmployeeName  string  `gorm:"->;column:employee_name"`
	LeaveTypeName string  `gorm:"->;column:leave_type_name"`
	LeaveTypeCode string  `gorm:"->;column:leave_type_code"`
	DecisionNotes *string `gorm:"->;column:decision_notes"`
}

func (LeaveRequest) TableName() string { return "leave_requests" }

type LeaveApproval struct {
	ID                string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID    string    `gorm:"column:organization_id"`
	LeaveRequestID    string    `gorm:"column:leave_request_id"`
	ApproverAccountID *string   `gorm:"column:approver_account_id"`
	Decision          string    `gorm:"column:decision"`
	Remarks           *string   `gorm:"column:remarks"`
	DecidedAt         time.Time `gorm:"column:decided_at"`
}

func (LeaveApproval) TableName() string { return "leave_approvals" }

type LeaveAdjustment struct {
	ID                  string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID      string    `gorm:"column:organization_id"`
	LeaveBalanceID      string    `gorm:"column:leave_balance_id"`
	EmployeeID          string    `gorm:"column:employee_id"`
	LeaveTypeID         string    `gorm:"column:leave_type_id"`
	AdjustmentDays      float64   `gorm:"column:adjustment_days"`
	Reason              string    `gorm:"column:reason"`
	AdjustedByAccountID *string   `gorm:"column:adjusted_by_account_id"`
	CreatedAt           time.Time `gorm:"column:created_at"`
}

func (LeaveAdjustment) TableName() string { return "leave_adjustments" }
