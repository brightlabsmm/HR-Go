package service

import (
	"context"
	"fmt"
	"strings"

	"hrgo/backend/internal/modules/control/organization/mapper"
	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/repository"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

type Service interface {
	Create(ctx context.Context, req request.CreateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	GetByID(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error)
	List(ctx context.Context, query request.ListOrganizationsQuery) ([]response.OrganizationResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, id string, req request.UpdateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	UpdateStatus(ctx context.Context, id string, req request.UpdateStatusRequest) (*response.OrganizationResponse, *apperrors.Error)
	Delete(ctx context.Context, id string) *apperrors.Error
	CreateAdminAccount(ctx context.Context, orgID string, req request.CreateAdminAccountRequest) (*response.AdminAccountResponse, *apperrors.Error)
	ListAdminAccounts(ctx context.Context, orgID string, q request.ListAdminAccountsQuery) ([]response.AdminAccountResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req request.CreateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error) {
	code := strings.TrimSpace(req.OrganizationCode)
	if code == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "organizationCode", Message: "Organization code is required."},
		})
	}

	contactEmail := strings.TrimSpace(req.ContactEmail)
	contactPhone := strings.TrimSpace(req.ContactPhone)
	country := strings.TrimSpace(req.Country)
	address := strings.TrimSpace(req.Address)

	var validationIssues []apperrors.FieldIssue
	if contactEmail == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email is required."})
	}
	if contactPhone == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Contact phone is required."})
	}
	if country == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "country", Message: "Country is required."})
	}
	if address == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "address", Message: "Address is required."})
	}
	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	existing, err := s.repo.FindByCode(ctx, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	existingByEmail, err := s.repo.FindByContactEmail(ctx, contactEmail)
	if err != nil {
		return nil, apperrors.Internal()
	}

	var dupIssues []apperrors.FieldIssue
	if existing != nil {
		dupIssues = append(dupIssues, apperrors.FieldIssue{
			Field: "organizationCode", Message: "This organization code is already in use.",
		})
	}
	if existingByEmail != nil {
		dupIssues = append(dupIssues, apperrors.FieldIssue{
			Field: "contactEmail", Message: "This contact email is already in use.",
		})
	}
	if len(dupIssues) > 0 {
		return nil, apperrors.ValidationFailed(dupIssues)
	}

	org := &models.Organization{
		Code:         code,
		LegalName:    strings.TrimSpace(req.LegalName),
		DisplayName:  strings.TrimSpace(req.DisplayName),
		ContactEmail: contactEmail,
		ContactPhone: contactPhone,
		Country:      country,
		Address:      address,
		Status:       "PENDING",
	}

	if err := s.repo.Create(ctx, org); err != nil {
		if appErr := mapUniqueConstraintError(err); appErr != nil {
			return nil, appErr
		}
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}
	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) List(ctx context.Context, query request.ListOrganizationsQuery) ([]response.OrganizationResponse, int, int, int64, *apperrors.Error) {
	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, page, pageSize, 0, apperrors.Internal()
	}

	res := mapper.ToOrganizationList(items)
	return res, page, pageSize, total, nil
}

func (s *service) Update(ctx context.Context, id string, req request.UpdateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	if req.OrganizationCode != nil {
		newCode := strings.TrimSpace(*req.OrganizationCode)
		if newCode == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "organizationCode", Message: "Organization code is required."},
			})
		}
		if !strings.EqualFold(newCode, org.Code) {
			existing, err := s.repo.FindByCode(ctx, newCode)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if existing != nil && existing.ID != org.ID {
				return nil, apperrors.Conflict("Organization code already in use")
			}
			org.Code = newCode
		}
	}

	if req.LegalName != nil {
		org.LegalName = strings.TrimSpace(*req.LegalName)
	}
	if req.DisplayName != nil {
		org.DisplayName = strings.TrimSpace(*req.DisplayName)
	}
	if req.ContactEmail != nil {
		newEmail := strings.TrimSpace(*req.ContactEmail)
		if newEmail == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "contactEmail", Message: "Contact email is required."},
			})
		}
		if !strings.EqualFold(newEmail, org.ContactEmail) {
			existingByEmail, err := s.repo.FindByContactEmail(ctx, newEmail)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if existingByEmail != nil && existingByEmail.ID != org.ID {
				return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
					{Field: "contactEmail", Message: "This contact email is already in use."},
				})
			}
		}
		org.ContactEmail = newEmail
	}
	if req.ContactPhone != nil {
		org.ContactPhone = strings.TrimSpace(*req.ContactPhone)
	}
	if req.Country != nil {
		org.Country = strings.TrimSpace(*req.Country)
	}
	if req.Address != nil {
		org.Address = strings.TrimSpace(*req.Address)
	}

	if err := s.repo.Update(ctx, org); err != nil {
		if appErr := mapUniqueConstraintError(err); appErr != nil {
			return nil, appErr
		}
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func mapUniqueConstraintError(err error) *apperrors.Error {
	msg := err.Error()
	if strings.Contains(msg, "idx_organizations_contact_email_lower") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "contactEmail", Message: "This contact email is already in use."},
		})
	}
	if strings.Contains(msg, "idx_organizations_code_lower") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "organizationCode", Message: "This organization code is already in use."},
		})
	}
	return nil
}

var allowedStatusTransitions = map[string]map[string]bool{
	"PENDING": {
		"ACTIVE": true,
	},
	"ACTIVE": {
		"SUSPENDED": true,
	},
	"SUSPENDED": {
		"ACTIVE": true,
	},
}

func (s *service) UpdateStatus(ctx context.Context, id string, req request.UpdateStatusRequest) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	current := strings.ToUpper(strings.TrimSpace(org.Status))
	target := strings.ToUpper(strings.TrimSpace(req.Status))

	validTargets, exists := allowedStatusTransitions[current]
	if !exists || !validTargets[target] {
		return nil, apperrors.Conflict(fmt.Sprintf("Invalid organization status transition from %s to %s", current, target))
	}

	if target == "SUSPENDED" && !req.Confirmation {
		return nil, apperrors.BadRequest("Confirmation is required for high-impact status changes.")
	}

	if target == "ACTIVE" {
		adminAccounts, err := s.repo.ListAdminAccounts(ctx, id, request.ListAdminAccountsQuery{})
		if err != nil {
			return nil, apperrors.Internal()
		}
		hasActiveAdmin := false
		for _, acc := range adminAccounts {
			if strings.EqualFold(acc.Status, "ACTIVE") {
				hasActiveAdmin = true
				break
			}
		}
		if !hasActiveAdmin {
			return nil, apperrors.BadRequest("Cannot activate organization without an active organization administrator account.")
		}
	}

	org.Status = target
	if err := s.repo.Update(ctx, org); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) Delete(ctx context.Context, id string) *apperrors.Error {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return apperrors.Internal()
	}
	if org == nil {
		return apperrors.NotFound("Organization not found")
	}
	if err := s.repo.SoftDelete(ctx, id); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) CreateAdminAccount(ctx context.Context, orgID string, req request.CreateAdminAccountRequest) (*response.AdminAccountResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	code := strings.TrimSpace(req.EmployeeCode)
	if code == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeCode", Message: "Employee code / identifier is required."},
		})
	}

	existingEmp, err := s.repo.FindEmployeeByCode(ctx, orgID, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existingEmp != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeCode", Message: "Employee code is already in use in this organization."},
		})
	}

	existingAcc, err := s.repo.FindAccountByIdentifier(ctx, orgID, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existingAcc != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeCode", Message: "Login identifier is already in use in this organization."},
		})
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		return nil, apperrors.Internal()
	}

	email := ""
	if req.Email != nil {
		email = strings.TrimSpace(*req.Email)
	}

	emp := &models.EmployeeIdentity{
		OrganizationID: orgID,
		EmployeeCode:   code,
		FirstName:      strings.TrimSpace(req.FirstName),
		LastName:       strings.TrimSpace(req.LastName),
		Email:          email,
	}

	acc := &models.OrganizationAccount{
		OrganizationID: orgID,
		Identifier:     code,
		PasswordHash:   hash,
		Status:         "ACTIVE",
	}

	detail, err := s.repo.CreateAdminAccount(ctx, emp, acc)
	if err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToAdminAccountResponse(detail)
	return &res, nil
}

func (s *service) ListAdminAccounts(ctx context.Context, orgID string, q request.ListAdminAccountsQuery) ([]response.AdminAccountResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	details, err := s.repo.ListAdminAccounts(ctx, orgID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToAdminAccountList(details)
	return res, nil
}
