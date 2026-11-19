package response

import "time"

type RoleSummary struct {
	ID       string `json:"id"`
	RoleCode string `json:"roleCode"`
	RoleName string `json:"roleName"`
}

type PlatformUserResponse struct {
	ID          string        `json:"id"`
	FullName    string        `json:"fullName"`
	Email       string        `json:"email"`
	Status      string        `json:"status"`
	Roles       []RoleSummary `json:"roles"`
	LastLoginAt *time.Time    `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}
