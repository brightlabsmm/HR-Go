package response

import "time"

type OrganizationResponse struct {
	ID                 string     `json:"id"`
	OrganizationCode   string     `json:"organizationCode"`
	LegalName          string     `json:"legalName"`
	DisplayName        string     `json:"displayName"`
	ContactEmail       string     `json:"contactEmail,omitempty"`
	ContactPhone       string     `json:"contactPhone,omitempty"`
	Country            string     `json:"country"`
	Address            string     `json:"address,omitempty"`
	Status             string     `json:"status"`
	SuspendNotifyFrom  *time.Time `json:"suspendNotifyFrom,omitempty"`
	SuspendNotifyTo    *time.Time `json:"suspendNotifyTo,omitempty"`
	ScheduledSuspendAt *time.Time `json:"scheduledSuspendAt,omitempty"`
	SuspendReason      *string    `json:"suspendReason,omitempty"`
	SuspendedAt        *time.Time `json:"suspendedAt,omitempty"`
	SessionsRevokedAt  *time.Time `json:"sessionsRevokedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type AdminAccountResponse struct {
	ID             string     `json:"id"`
	OrganizationID string     `json:"organizationId"`
	EmployeeID     string     `json:"employeeId"`
	Identifier     string     `json:"identifier"`
	EmployeeCode   string     `json:"employeeCode"`
	FirstName      string     `json:"firstName"`
	LastName       string     `json:"lastName"`
	FullName       string     `json:"fullName"`
	Email          string     `json:"email,omitempty"`
	RoleCode       string     `json:"roleCode"`
	RoleName       string     `json:"roleName"`
	Status         string     `json:"status"`
	LastLoginAt    *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}
