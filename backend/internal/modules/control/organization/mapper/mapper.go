package mapper

import (
	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/response"
)

func ToOrganizationResponse(org *models.Organization) response.OrganizationResponse {
	return response.OrganizationResponse{
		ID:               org.ID,
		OrganizationCode: org.Code,
		LegalName:        org.LegalName,
		DisplayName:      org.DisplayName,
		ContactEmail:     org.ContactEmail,
		ContactPhone:     org.ContactPhone,
		Country:          org.Country,
		Address:          org.Address,
		Status:           org.Status,
		CreatedAt:        org.CreatedAt,
		UpdatedAt:        org.UpdatedAt,
	}
}

func ToOrganizationList(orgs []models.Organization) []response.OrganizationResponse {
	res := make([]response.OrganizationResponse, 0, len(orgs))
	for i := range orgs {
		res = append(res, ToOrganizationResponse(&orgs[i]))
	}
	return res
}
