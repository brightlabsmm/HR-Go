package response

import (
	"time"
)

type OrganizationSettingsResponse struct {
	ID                   string    `json:"id"`
	OrganizationCode     string    `json:"organizationCode"`
	LegalName            string    `json:"legalName"`
	DisplayName          string    `json:"displayName"`
	ContactEmail         string    `json:"contactEmail"`
	ContactPhone         string    `json:"contactPhone"`
	Country              string    `json:"country"`
	Address              string    `json:"address"`
	Status               string    `json:"status"`
	BranchCodeFormat     string    `json:"branchCodeFormat"`
	DepartmentCodeFormat string    `json:"departmentCodeFormat"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}
