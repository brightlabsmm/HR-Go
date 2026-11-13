package request

type CreateOrganizationRequest struct {
	OrganizationCode string `json:"organizationCode" binding:"required"`
	LegalName        string `json:"legalName" binding:"required"`
	DisplayName      string `json:"displayName" binding:"required"`
	ContactEmail     string `json:"contactEmail"`
	ContactPhone     string `json:"contactPhone"`
	Country          string `json:"country"`
	Address          string `json:"address"`
}

type UpdateOrganizationRequest struct {
	LegalName    *string `json:"legalName"`
	DisplayName  *string `json:"displayName"`
	ContactEmail *string `json:"contactEmail"`
	ContactPhone *string `json:"contactPhone"`
	Country      *string `json:"country"`
	Address      *string `json:"address"`
}

type UpdateStatusRequest struct {
	Status       string `json:"status" binding:"required"`
	Reason       string `json:"reason"`
	Confirmation bool   `json:"confirmation"`
}

type ListOrganizationsQuery struct {
	Q                string `form:"q"`
	OrganizationCode string `form:"organizationCode"`
	Status           string `form:"status"`
	Page             int    `form:"page,default=1"`
	PageSize         int    `form:"pageSize,default=20"`
	SortBy           string `form:"sortBy"`
	SortDirection    string `form:"sortDirection"`
}
