package response

type RoleSummary struct {
	RoleCode string `json:"roleCode"`
	RoleName string `json:"roleName"`
}

type UserProfile struct {
	ID          string        `json:"id"`
	FullName    string        `json:"fullName"`
	Email       string        `json:"email"`
	Status      string        `json:"status"`
	Roles       []RoleSummary `json:"roles"`
	Permissions []string      `json:"permissions"`
}

type LoginResponse struct {
	AccessToken string      `json:"accessToken"`
	TokenType   string      `json:"tokenType"`
	ExpiresIn   int64       `json:"expiresIn"`
	User        UserProfile `json:"user"`
}
