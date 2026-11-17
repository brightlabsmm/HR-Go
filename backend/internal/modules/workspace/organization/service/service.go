package service

import (
	"context"
	"strings"

	"hrgo/backend/internal/modules/workspace/organization/models"
	"hrgo/backend/internal/modules/workspace/organization/repository"
	"hrgo/backend/internal/modules/workspace/organization/request"
	"hrgo/backend/internal/modules/workspace/organization/response"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/codeformat"
)

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

	if req.DisplayName != nil {
		name := strings.TrimSpace(*req.DisplayName)
		if name == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "displayName", Message: "Display name cannot be empty."},
			})
		}
		org.DisplayName = name
	}

	if req.ContactEmail != nil {
		email := strings.TrimSpace(*req.ContactEmail)
		org.ContactEmail = &email
	}
	if req.ContactPhone != nil {
		phone := strings.TrimSpace(*req.ContactPhone)
		org.ContactPhone = &phone
	}
	if req.Country != nil {
		country := strings.TrimSpace(*req.Country)
		org.Country = &country
	}
	if req.Address != nil {
		address := strings.TrimSpace(*req.Address)
		org.Address = &address
	}

	if err := s.repo.Update(ctx, org); err != nil {
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
