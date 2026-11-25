package response

import "time"

type BranchOperatingHourResponse struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	BranchID       string    `json:"branchId"`
	DayOfWeek      string    `json:"dayOfWeek"`
	OpeningTime    *string   `json:"openingTime"`
	ClosingTime    *string   `json:"closingTime"`
	IsClosed       bool      `json:"isClosed"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
