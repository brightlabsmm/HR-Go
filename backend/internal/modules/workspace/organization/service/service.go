package service

import (
	"context"
	"regexp"
	"strings"

	"hrgo/backend/internal/modules/workspace/organization/models"
	"hrgo/backend/internal/modules/workspace/organization/repository"
	"hrgo/backend/internal/modules/workspace/organization/request"
	"hrgo/backend/internal/modules/workspace/organization/response"
	"hrgo/backend/internal/shared/codeformat"
	apperrors "hrgo/backend/internal/shared/errors"
)

var (
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
	GetSettings(ctx context.Context, orgID string) (*response.OrganizationSettingsResponse, *apperrors.Error)
	UpdateSettings(ctx context.Context, orgID string, req request.UpdateOrganizationSettingsRequest) (*response.OrganizationSettingsResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetSettings(ctx context.Context, orgID string) (*response.OrganizationSettingsResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	settings, err := s.repo.GetSettings(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}

	return toResponse(org, settings), nil
}

func (s *service) UpdateSettings(ctx context.Context, orgID string, req request.UpdateOrganizationSettingsRequest) (*response.OrganizationSettingsResponse, *apperrors.Error) {
	org, err := s.repo.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if org == nil {
		return nil, apperrors.NotFound("Organization not found")
	}

	var validationIssues []apperrors.FieldIssue

	if req.DisplayName != nil {
		name := strings.TrimSpace(*req.DisplayName)
		if name == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name cannot be empty."})
		} else if len(name) > 255 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "displayName", Message: "Display name must not exceed 255 characters."})
		} else {
			org.DisplayName = name
		}
	}

	if req.ContactEmail != nil {
		email := strings.TrimSpace(*req.ContactEmail)
		if email == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email is required."})
		} else if len(email) > 255 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Contact email must not exceed 255 characters."})
		} else if !emailRegex.MatchString(email) {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "contactEmail", Message: "Please enter a valid email address."})
		} else {
			currentEmail := ""
			if org.ContactEmail != nil {
				currentEmail = *org.ContactEmail
			}
			if !strings.EqualFold(email, currentEmail) {
				existingByEmail, err := s.repo.FindByContactEmail(ctx, email)
				if err != nil {
					return nil, apperrors.Internal()
				}
				if existingByEmail != nil && existingByEmail.ID != org.ID {
					validationIssues = append(validationIssues, apperrors.FieldIssue{
						Field: "contactEmail", Message: "This contact email is already in use.",
					})
				}
			}
			org.ContactEmail = &email
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
				org.ContactPhone = &phone
			}
		} else {
			org.ContactPhone = nil
		}
	}

	if req.Country != nil {
		country := strings.TrimSpace(*req.Country)
		if country != "" {
			if len(country) > 10 {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "country", Message: "Country code must not exceed 10 characters."})
			} else {
				org.Country = &country
			}
		} else {
			org.Country = nil
		}
	}

	if req.Address != nil {
		address := strings.TrimSpace(*req.Address)
		if len(address) > 2000 {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "address", Message: "Address must not exceed 2000 characters."})
		} else {
			org.Address = &address
		}
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	if err := s.repo.Update(ctx, org); err != nil {
		msg := err.Error()
		if strings.Contains(msg, "idx_organizations_contact_email_lower") {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "contactEmail", Message: "This contact email is already in use."},
			})
		}
		if strings.Contains(msg, "value too long for type character varying(10)") {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "country", Message: "Country code must not exceed 10 characters."},
			})
		}
		if strings.Contains(msg, "value too long for type character varying(255)") {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "displayName", Message: "Value must not exceed 255 characters."},
			})
		}
		return nil, apperrors.Internal()
	}

	if req.BranchCodeFormat != nil {
		format := strings.TrimSpace(*req.BranchCodeFormat)
		if format == "" {
			format = codeformat.DefaultBranchCodeFormat
		}
		_ = s.repo.SaveSetting(ctx, orgID, codeformat.SettingKeyBranchCodeFormat, format)
	}

	if req.DepartmentCodeFormat != nil {
		format := strings.TrimSpace(*req.DepartmentCodeFormat)
		if format == "" {
			format = codeformat.DefaultDepartmentCodeFormat
		}
		_ = s.repo.SaveSetting(ctx, orgID, codeformat.SettingKeyDepartmentCodeFormat, format)
	}

	settings, err := s.repo.GetSettings(ctx, orgID)
	if err != nil {
		return nil, apperrors.Internal()
	}

	return toResponse(org, settings), nil
}

func toResponse(org *models.Organization, settings map[string]string) *response.OrganizationSettingsResponse {
	branchFormat := codeformat.DefaultBranchCodeFormat
	if val, ok := settings[codeformat.SettingKeyBranchCodeFormat]; ok && strings.TrimSpace(val) != "" {
		branchFormat = val
	}

	deptFormat := codeformat.DefaultDepartmentCodeFormat
	if val, ok := settings[codeformat.SettingKeyDepartmentCodeFormat]; ok && strings.TrimSpace(val) != "" {
		deptFormat = val
	}

	contactEmail := ""
	if org.ContactEmail != nil {
		contactEmail = *org.ContactEmail
	}
	contactPhone := ""
	if org.ContactPhone != nil {
		contactPhone = *org.ContactPhone
	}
	country := ""
	if org.Country != nil {
		country = *org.Country
	}
	address := ""
	if org.Address != nil {
		address = *org.Address
	}

	return &response.OrganizationSettingsResponse{
		ID:                   org.ID,
		OrganizationCode:     org.Code,
		LegalName:            org.LegalName,
		DisplayName:          org.DisplayName,
		ContactEmail:         contactEmail,
		ContactPhone:         contactPhone,
		Country:              country,
		Address:              address,
		Status:               org.Status,
		BranchCodeFormat:     branchFormat,
		DepartmentCodeFormat: deptFormat,
		CreatedAt:            org.CreatedAt,
		UpdatedAt:            org.UpdatedAt,
	}
}
