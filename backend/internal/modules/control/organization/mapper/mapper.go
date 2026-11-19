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

func ToAdminAccountResponse(detail *models.AdminAccountDetail) response.AdminAccountResponse {
	fullName := detail.FirstName
	if detail.LastName != "" {
		if fullName != "" {
			fullName += " " + detail.LastName
		} else {
			fullName = detail.LastName
		}
	}

	return response.AdminAccountResponse{
		ID:             detail.AccountID,
		OrganizationID: detail.OrganizationID,
		EmployeeID:     detail.EmployeeID,
		Identifier:     detail.Identifier,
		EmployeeCode:   detail.EmployeeCode,
		FirstName:      detail.FirstName,
		LastName:       detail.LastName,
		FullName:       fullName,
		Email:          detail.Email,
		RoleCode:       detail.RoleCode,
		RoleName:       detail.RoleName,
		Status:         detail.Status,
		LastLoginAt:    detail.LastLoginAt,
		CreatedAt:      detail.CreatedAt,
	}
}

func ToAdminAccountList(details []models.AdminAccountDetail) []response.AdminAccountResponse {
	res := make([]response.AdminAccountResponse, 0, len(details))
	for i := range details {
		res = append(res, ToAdminAccountResponse(&details[i]))
	}
	return res
}
