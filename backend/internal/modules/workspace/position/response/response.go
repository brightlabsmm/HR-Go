package response

import "time"

type PositionResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	DepartmentID   *string   `json:"departmentId"`
	PositionCode   string    `json:"positionCode"`
	PositionName   string    `json:"positionName"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
