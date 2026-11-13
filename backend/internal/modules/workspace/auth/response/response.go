package response

type RoleAssignment struct {
	RoleCode     string  `json:"roleCode"`
	RoleName     string  `json:"roleName"`
	BranchID     *string `json:"branchId"`
	DepartmentID *string `json:"departmentId"`
}

type WorkspaceUserProfile struct {
	OrganizationID   string           `json:"organizationId"`
	OrganizationCode string           `json:"organizationCode"`
	AccountID        string           `json:"accountId"`
	EmployeeID       string           `json:"employeeId"`
	EmployeeCode     string           `json:"employeeCode"`
	FullName         string           `json:"fullName"`
	AccountStatus    string           `json:"accountStatus"`
	Roles            []RoleAssignment `json:"roles"`
	Permissions      []string         `json:"permissions"`
}

type LoginResponse struct {
	AccessToken string               `json:"accessToken"`
	TokenType   string               `json:"tokenType"`
	ExpiresIn   int64                `json:"expiresIn"`
	User        WorkspaceUserProfile `json:"user"`
}
