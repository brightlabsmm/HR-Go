package request

import (
	"time"

	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type CreateOrganizationRequest struct {
	OrganizationCode string `json:"organizationCode" binding:"required,max=50"`
	LegalName        string `json:"legalName" binding:"required,max=255"`
	DisplayName      string `json:"displayName" binding:"required,max=255"`
	ContactEmail     string `json:"contactEmail" binding:"required,email,max=255"`
	ContactPhone     string `json:"contactPhone" binding:"required,max=50"`
	Country          string `json:"country" binding:"required,max=10"`
	Address          string `json:"address" binding:"required,max=2000"`
}

type UpdateOrganizationRequest struct {
	OrganizationCode *string `json:"organizationCode" binding:"omitempty,max=50"`
	LegalName        *string `json:"legalName" binding:"omitempty,max=255"`
	DisplayName      *string `json:"displayName" binding:"omitempty,max=255"`
	ContactEmail     *string `json:"contactEmail" binding:"omitempty,email,max=255"`
	ContactPhone     *string `json:"contactPhone" binding:"omitempty,max=50"`
	Country          *string `json:"country" binding:"omitempty,max=10"`
	Address          *string `json:"address" binding:"omitempty,max=2000"`
}

type UpdateStatusRequest struct {
	Status       string     `json:"status" binding:"required"`
	Reason       string     `json:"reason"`
	Confirmation bool       `json:"confirmation"`
	Immediate    *bool      `json:"immediate"`
	NotifyFrom   *time.Time `json:"notifyFrom"`
	NotifyTo     *time.Time `json:"notifyTo"`
	SuspendAt    *time.Time `json:"suspendAt"`
}

type CreateAdminAccountRequest struct {
	FirstName    string  `json:"firstName" binding:"required"`
	LastName     string  `json:"lastName" binding:"required"`
	Email        *string `json:"email"`
	EmployeeCode string  `json:"employeeCode" binding:"required"`
	Password     string  `json:"password" binding:"required"`
}

type ListOrganizationsQuery struct {
	Q                string `form:"q"`
	OrganizationCode string `form:"organizationCode"`
	Status           string `form:"status"`
	Page             int    `form:"page,default=1"`
	PageSize         int    `form:"pageSize,default=20"`
	sorting.Query
	filtering.Params
}

type ListAdminAccountsQuery struct {
	sorting.Query
	filtering.Params
}
