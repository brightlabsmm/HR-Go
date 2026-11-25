package response

import "time"

type OvertimeCategoryResponse struct {
	ID                  string    `json:"id"`
	OrganizationID      string    `json:"organizationId"`
	Code                string    `json:"code"`
	Name                string    `json:"name"`
	Description         *string   `json:"description,omitempty"`
	RateMultiplier      float64   `json:"rateMultiplier"`
	MinMinutes          int       `json:"minMinutes"`
	MaxDailyMinutes     int       `json:"maxDailyMinutes"`
	RequiresPreApproval bool      `json:"requiresPreApproval"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"createdAt"`
}

type OvertimeRequestResponse struct {
	ID                 string    `json:"id"`
	OrganizationID     string    `json:"organizationId"`
	EmployeeID         string    `json:"employeeId"`
	EmployeeCode       string    `json:"employeeCode,omitempty"`
	EmployeeName       string    `json:"employeeName,omitempty"`
	OvertimeCategoryID string    `json:"overtimeCategoryId"`
	CategoryCode       string    `json:"categoryCode"`
	CategoryName       string    `json:"categoryName"`
	Multiplier         float64   `json:"multiplier"`
	WorkDate           string    `json:"workDate"`
	StartTime          string    `json:"startTime"`
	EndTime            string    `json:"endTime"`
	RequestedMinutes   int       `json:"requestedMinutes"`
	Reason             string    `json:"reason"`
	RequestStatus      string    `json:"requestStatus"`
	DecisionNotes      *string   `json:"decisionNotes,omitempty"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type OvertimeEntryResponse struct {
	ID                 string    `json:"id"`
	OvertimeRequestID  string    `json:"overtimeRequestId"`
	EmployeeID         string    `json:"employeeId"`
	OvertimeCategoryID string    `json:"overtimeCategoryId"`
	WorkDate           string    `json:"workDate"`
	ApprovedMinutes    int       `json:"approvedMinutes"`
	Multiplier         float64   `json:"multiplier"`
	CreatedAt          time.Time `json:"createdAt"`
}
