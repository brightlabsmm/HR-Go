package response

import (
	"encoding/json"
	"time"
)

type ContractResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	EmployeeID     string    `json:"employeeId"`
	ContractType   string    `json:"contractType"`
	StartDate      string    `json:"startDate"`
	EndDate        *string   `json:"endDate"`
	ContractStatus string    `json:"contractStatus"`
	Notes          *string   `json:"notes"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type DocumentResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	EmployeeID     string    `json:"employeeId"`
	DocumentType   string    `json:"documentType"`
	DocumentName   string    `json:"documentName"`
	FileReference  string    `json:"fileReference"`
	ExpiryDate     *string   `json:"expiryDate"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type ServiceYearResponse struct {
	ID              string    `json:"id"`
	OrganizationID  string    `json:"organizationId"`
	EmployeeID      string    `json:"employeeId"`
	CalculationDate string    `json:"calculationDate"`
	ServiceYears    float64   `json:"serviceYears"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ExitRecordResponse struct {
	ID                  string    `json:"id"`
	OrganizationID      string    `json:"organizationId"`
	EmployeeID          string    `json:"employeeId"`
	RecordedByAccountID *string   `json:"recordedByAccountId"`
	ExitType            string    `json:"exitType"`
	EffectiveDate       string    `json:"effectiveDate"`
	Reason              *string   `json:"reason"`
	DecisionStatus      string    `json:"decisionStatus"`
	RecordedAt          time.Time `json:"recordedAt"`
}

type EmployeeHistoryResponse struct {
	ID                 string          `json:"id"`
	OrganizationID     string          `json:"organizationId"`
	EmployeeID         string          `json:"employeeId"`
	ExitRecordID       *string         `json:"exitRecordId"`
	EmployeeSnapshot   json.RawMessage `json:"employeeSnapshot"`
	ProfileSnapshot    json.RawMessage `json:"profileSnapshot,omitempty"`
	SnapshotReason     string          `json:"snapshotReason"`
	SnapshotAt         time.Time       `json:"snapshotAt"`
	CreatedByAccountID *string         `json:"createdByAccountId"`
}
