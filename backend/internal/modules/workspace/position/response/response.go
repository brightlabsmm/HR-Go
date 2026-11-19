package response

type PositionResponse struct {
	ID             string  `json:"id"`
	OrganizationID string  `json:"organizationId"`
	DepartmentID   *string `json:"departmentId"`
	PositionCode   string  `json:"positionCode"`
	PositionName   string  `json:"positionName"`
	Status         string  `json:"status"`
}
