package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"hrgo/backend/internal/modules/control/organization/mapper"
	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/repository"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/modules/control/organization/response"
	countryutil "hrgo/backend/internal/shared/country"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

var (
	codeRegex      = regexp.MustCompile(`^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$`)
	emailRegex     = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	phoneCharRegex = regexp.MustCompile(`^[\d\s\-\+\(\)]+$`)
)

func isValidPhoneNumber(phone string) bool {
	if !phoneCharRegex.MatchString(phone) {
		return false
	}
	digits := 0
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits++
		}
	}
	return digits >= 7 && digits <= 20
}

type Service interface {
	Create(ctx context.Context, req request.CreateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	GetByID(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error)
	List(ctx context.Context, query request.ListOrganizationsQuery) ([]response.OrganizationResponse, int, int, int64, *apperrors.Error)
	Update(ctx context.Context, id string, req request.UpdateOrganizationRequest) (*response.OrganizationResponse, *apperrors.Error)
	UpdateStatus(ctx context.Context, id string, req request.UpdateStatusRequest) (*response.OrganizationResponse, *apperrors.Error)
	CancelSuspendSchedule(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error)
	ProcessDueSuspensions(ctx context.Context) ([]string, error)
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
	legalName := strings.TrimSpace(req.LegalName)
	displayName := strings.TrimSpace(req.DisplayName)
	contactEmail := strings.TrimSpace(req.ContactEmail)
	contactPhone := strings.TrimSpace(req.ContactPhone)
	country := strings.TrimSpace(req.Country)
	address := strings.TrimSpace(req.Address)

	var validationIssues []apperrors.FieldIssue
	if code == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "organizationCode", Message: "Organization code is required."})
	} else if len(code) > 50 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "organizationCode", Message: "Organization code must not exceed 50 characters."})
	} else if !codeRegex.MatchString(code) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "organizationCode", Message: "Organization code can only contain letters, numbers, and hyphens."})
	}

	if legalName == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "legalName", Message: "Legal name is required."})
	} else if len(legalName) > 255 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "legalName", Message: "Legal name must not exceed 255 characters."})
	}

	if displayName == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name is required."})
	} else if len(displayName) > 255 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name must not exceed 255 characters."})
	}

	if contactEmail == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email is required."})
	} else if len(contactEmail) > 255 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email must not exceed 255 characters."})
	} else if !emailRegex.MatchString(contactEmail) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Please enter a valid email address."})
	}

	if contactPhone == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Contact phone is required."})
	} else if len(contactPhone) > 50 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Contact phone must not exceed 50 characters."})
	} else if !isValidPhoneNumber(contactPhone) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Please enter a valid phone number."})
	}

	if country == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "country", Message: "Country is required."})
	} else if countryCode := strings.ToUpper(country); len(country) > 10 || !countryutil.IsValid(countryCode) {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "country", Message: "Please select a valid country from the allowed list."})
	} else {
		country = countryCode
	}

	if address == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "address", Message: "Address is required."})
	} else if len(address) > 2000 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "address", Message: "Address must not exceed 2000 characters."})
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
		LegalName:    legalName,
		DisplayName:  displayName,
		ContactEmail: contactEmail,
		ContactPhone: contactPhone,
		Country:      country,
		Address:      address,
		Status:       "PENDING",
	}

	if err := s.repo.Create(ctx, org); err != nil {
		if appErr := mapDbError(err); appErr != nil {
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

	var validationIssues []apperrors.FieldIssue

	if req.OrganizationCode != nil {
		newCode := strings.TrimSpace(*req.OrganizationCode)
		if newCode != "" && !strings.EqualFold(newCode, org.Code) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "organizationCode", Message: "Organization code cannot be changed after creation."},
			})
		}
	}

	if req.LegalName != nil {
		legalName := strings.TrimSpace(*req.LegalName)
		if legalName == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "legalName", Message: "Legal name is required."})
		} else if len(legalName) > 255 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "legalName", Message: "Legal name must not exceed 255 characters."})
		} else {
			org.LegalName = legalName
		}
	}

	if req.DisplayName != nil {
		displayName := strings.TrimSpace(*req.DisplayName)
		if displayName == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name is required."})
		} else if len(displayName) > 255 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name must not exceed 255 characters."})
		} else {
			org.DisplayName = displayName
		}
	}

	if req.ContactEmail != nil {
		newEmail := strings.TrimSpace(*req.ContactEmail)
		if newEmail == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email is required."})
		} else if len(newEmail) > 255 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email must not exceed 255 characters."})
		} else if !emailRegex.MatchString(newEmail) {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Please enter a valid email address."})
		} else {
			if !strings.EqualFold(newEmail, org.ContactEmail) {
				existingByEmail, err := s.repo.FindByContactEmail(ctx, newEmail)
				if err != nil {
					return nil, apperrors.Internal()
				}
				if existingByEmail != nil && existingByEmail.ID != org.ID {
					validationIssues = append(validationIssues, apperrors.FieldIssue{
						Field: "contactEmail", Message: "This contact email is already in use.",
					})
				} else {
					org.ContactEmail = newEmail
				}
			} else {
				org.ContactEmail = newEmail
			}
		}
	}

	if req.ContactPhone != nil {
		phone := strings.TrimSpace(*req.ContactPhone)
		if phone != "" {
			if len(phone) > 50 {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Contact phone must not exceed 50 characters."})
			} else if !isValidPhoneNumber(phone) {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactPhone", Message: "Please enter a valid phone number."})
			} else {
				org.ContactPhone = phone
			}
		} else {
			org.ContactPhone = ""
		}
	}

	if req.Country != nil {
		country := strings.TrimSpace(*req.Country)
		if country != "" {
			if countryCode := strings.ToUpper(country); len(country) > 10 || !countryutil.IsValid(countryCode) {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "country", Message: "Please select a valid country from the allowed list."})
			} else {
				org.Country = countryCode
			}
		} else {
			org.Country = ""
		}
	}

	if req.Address != nil {
		address := strings.TrimSpace(*req.Address)
		if len(address) > 2000 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "address", Message: "Address must not exceed 2000 characters."})
		} else {
			org.Address = address
		}
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	if err := s.repo.Update(ctx, org); err != nil {
		if appErr := mapDbError(err); appErr != nil {
			return nil, appErr
		}
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func mapDbError(err error) *apperrors.Error {
	if err == nil {
		return nil
	}
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
	if strings.Contains(msg, "value too long for type character varying(10)") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "country", Message: "Country code must not exceed 10 characters."},
		})
	}
	if strings.Contains(msg, "value too long for type character varying(50)") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "organizationCode", Message: "Value must not exceed 50 characters."},
		})
	}
	if strings.Contains(msg, "value too long for type character varying(255)") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "displayName", Message: "Value must not exceed 255 characters."},
		})
	}
	if strings.Contains(msg, "value too long for type character varying") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "displayName", Message: "One or more fields exceed maximum allowed length."},
		})
	}
	if strings.Contains(msg, "null value in column \"legal_name\"") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "legalName", Message: "Legal name is required."}})
	}
	if strings.Contains(msg, "null value in column \"display_name\"") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "displayName", Message: "Display name is required."}})
	}
	if strings.Contains(msg, "null value in column \"code\"") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "organizationCode", Message: "Organization code is required."}})
	}
	if strings.Contains(msg, "null value in column \"country\"") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "country", Message: "Country is required."}})
	}
	if strings.Contains(msg, "chk_organizations_country") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "country", Message: "Please select a valid country from the allowed list."},
		})
	}
	if strings.Contains(msg, "chk_org_status") {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "status", Message: "Invalid organization status."},
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

	if target == "SUSPENDED" {
		isImmediate := true
		if req.Immediate != nil {
			isImmediate = *req.Immediate
		} else if req.SuspendAt != nil {
			isImmediate = false
		}

		if isImmediate {
			now := time.Now().UTC()
			if err := s.repo.SuspendAndRevokeSessions(ctx, id, req.Reason, now); err != nil {
				return nil, apperrors.Internal()
			}
			updated, err := s.repo.FindByID(ctx, id)
			if err != nil || updated == nil {
				return nil, apperrors.Internal()
			}
			res := mapper.ToOrganizationResponse(updated)
			return &res, nil
		}

		now := time.Now().UTC()
		if req.SuspendAt == nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "suspendAt", Message: "Scheduled suspension requires a suspend date and time."},
			})
		}
		if !req.SuspendAt.After(now) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "suspendAt", Message: "Scheduled suspend date must be in the future."},
			})
		}
		if req.NotifyFrom != nil && req.NotifyTo != nil && req.NotifyFrom.After(*req.NotifyTo) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "notifyFrom", Message: "Notification start date cannot be after notification end date."},
			})
		}
		if req.NotifyTo != nil && req.NotifyTo.After(*req.SuspendAt) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "notifyTo", Message: "Notification end date cannot be after suspension date."},
			})
		}
		if req.NotifyFrom != nil && req.NotifyFrom.After(*req.SuspendAt) {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "notifyFrom", Message: "Notification start date cannot be after suspension date."},
			})
		}

		org.ScheduledSuspendAt = req.SuspendAt
		org.SuspendNotifyFrom = req.NotifyFrom
		org.SuspendNotifyTo = req.NotifyTo
		if strings.TrimSpace(req.Reason) != "" {
			trimmedReason := strings.TrimSpace(req.Reason)
			org.SuspendReason = &trimmedReason
		} else {
			org.SuspendReason = nil
		}
		if err := s.repo.Update(ctx, org); err != nil {
			return nil, apperrors.Internal()
		}

		res := mapper.ToOrganizationResponse(org)
		return &res, nil
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

		org.Status = "ACTIVE"
		org.ScheduledSuspendAt = nil
		org.SuspendNotifyFrom = nil
		org.SuspendNotifyTo = nil
		org.SuspendReason = nil
		org.SuspendedAt = nil
		if err := s.repo.Update(ctx, org); err != nil {
			return nil, apperrors.Internal()
		}
	}

	res := mapper.ToOrganizationResponse(org)
	return &res, nil
}

func (s *service) CancelSuspendSchedule(ctx context.Context, id string) (*response.OrganizationResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	if err := s.repo.ClearSuspendSchedule(ctx, id); err != nil {
		return nil, apperrors.Internal()
	}

	updated, err := s.repo.FindByID(ctx, id)
	if err != nil || updated == nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToOrganizationResponse(updated)
	return &res, nil
}

func (s *service) ProcessDueSuspensions(ctx context.Context) ([]string, error) {
	now := time.Now().UTC()
	return s.repo.SuspendDueOrganizations(ctx, now)
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

	if err := security.ValidatePasswordStrength(req.Password); err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "password", Message: err.Error()},
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
		OrganizationID:     orgID,
		Identifier:         code,
		PasswordHash:       hash,
		Status:             "ACTIVE",
		MustChangePassword: true,
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
