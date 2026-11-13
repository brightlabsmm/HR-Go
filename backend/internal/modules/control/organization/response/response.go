package response

import "time"

type OrganizationResponse struct {
	ID               string    `json:"id"`
	OrganizationCode string    `json:"organizationCode"`
	LegalName        string    `json:"legalName"`
	DisplayName      string    `json:"displayName"`
	ContactEmail     string    `json:"contactEmail,omitempty"`
	ContactPhone     string    `json:"contactPhone,omitempty"`
	Country          string    `json:"country"`
	Address          string    `json:"address,omitempty"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}
