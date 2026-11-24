package response

type RoleAssignment struct {
	RoleCode     string  `json:"roleCode"`
	RoleName     string  `json:"roleName"`
	BranchID     *string `json:"branchId"`
	DepartmentID *string `json:"departmentId"`
}

type SuspensionNotice struct {
	ScheduledSuspendAt string `json:"scheduledSuspendAt"`
	Reason             string `json:"reason,omitempty"`
}

type WorkspaceUserProfile struct {
	OrganizationID     string            `json:"organizationId"`
	OrganizationName   string            `json:"organizationName"`
	AccountID          string            `json:"accountId"`
	EmployeeID         string            `json:"employeeId"`
	EmployeeCode       string            `json:"employeeCode"`
	FullName           string            `json:"fullName"`
	AccountStatus      string            `json:"accountStatus"`
	MustChangePassword bool              `json:"mustChangePassword"`
	Roles              []RoleAssignment  `json:"roles"`
	Permissions        []string          `json:"permissions"`
	SuspensionNotice   *SuspensionNotice `json:"suspensionNotice,omitempty"`
}

type LoginResponse struct {
	AccessToken        string               `json:"accessToken"`
	TokenType          string               `json:"tokenType"`
	ExpiresIn          int64                `json:"expiresIn"`
	MustChangePassword bool                 `json:"mustChangePassword"`
	User               WorkspaceUserProfile `json:"user"`
}
