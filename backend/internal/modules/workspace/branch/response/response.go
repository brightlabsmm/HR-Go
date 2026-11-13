package response

type BranchResponse struct {
	ID             string  `json:"id"`
	OrganizationID string  `json:"organizationId"`
	ParentID       *string `json:"parentId"`
	BranchCode     string  `json:"branchCode"`
	BranchName     string  `json:"branchName"`
	Address        string  `json:"address,omitempty"`
	Status         string  `json:"status"`
}
