package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/control/organization/models"
	"hrgo/backend/internal/modules/control/organization/request"
	"hrgo/backend/internal/shared/codeformat"
	"hrgo/backend/internal/shared/sorting"
)

type Repository interface {
	Create(ctx context.Context, org *models.Organization) error
	FindByID(ctx context.Context, id string) (*models.Organization, error)
	FindByCode(ctx context.Context, code string) (*models.Organization, error)
	FindByContactEmail(ctx context.Context, email string) (*models.Organization, error)
	Update(ctx context.Context, org *models.Organization) error
	SoftDelete(ctx context.Context, id string) error
	List(ctx context.Context, q request.ListOrganizationsQuery) ([]models.Organization, int64, error)
	CreateAdminAccount(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount) (*models.AdminAccountDetail, error)
	ListAdminAccounts(ctx context.Context, orgID string, q request.ListAdminAccountsQuery) ([]models.AdminAccountDetail, error)
	FindEmployeeByCode(ctx context.Context, orgID string, code string) (*models.EmployeeIdentity, error)
	FindAccountByIdentifier(ctx context.Context, orgID string, identifier string) (*models.OrganizationAccount, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(org).Error; err != nil {
			return err
		}

		defaultSettings := []models.OrganizationSetting{
			{
				OrganizationID: org.ID,
				SettingKey:     codeformat.SettingKeyBranchCodeFormat,
				SettingValue:   codeformat.DefaultBranchCodeFormat,
			},
			{
				OrganizationID: org.ID,
				SettingKey:     codeformat.SettingKeyDepartmentCodeFormat,
				SettingValue:   codeformat.DefaultDepartmentCodeFormat,
			},
		}

		return tx.Create(&defaultSettings).Error
	})
}

func (r *repository) FindByID(ctx context.Context, id string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) FindByCode(ctx context.Context, code string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("LOWER(code) = LOWER(?)", code).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) FindByContactEmail(ctx context.Context, email string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.WithContext(ctx).Where("LOWER(contact_email) = LOWER(?)", email).First(&org).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &org, nil
}

func (r *repository) Update(ctx context.Context, org *models.Organization) error {
	return r.db.WithContext(ctx).Save(org).Error
}

func (r *repository) SoftDelete(ctx context.Context, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.Organization{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]any{
			"deleted_at": now,
			"updated_at": now,
		}).Error
}

func (r *repository) List(ctx context.Context, query request.ListOrganizationsQuery) ([]models.Organization, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Organization{})

	if term := strings.TrimSpace(query.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(legal_name) LIKE ? OR LOWER(display_name) LIKE ? OR LOWER(code) LIKE ?", like, like, like)
	}
	if code := strings.TrimSpace(query.OrganizationCode); code != "" {
		db = db.Where("LOWER(code) = LOWER(?)", code)
	}
	if status := strings.TrimSpace(query.Status); status != "" {
		db = db.Where("status = ?", status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var list []models.Organization
	err := sorting.Apply(db, query.SortBy, query.Orders(), sorting.Options{
		Allowed: map[string]string{
			"code":        "code",
			"legalname":   "legal_name",
			"legal_name":  "legal_name",
			"status":      "status",
			"createdat":   "created_at",
			"created_at":  "created_at",
			"displayname": "display_name",
		},
		Default:      "created_at DESC",
		DefaultOrder: "DESC",
	}).
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}

func (r *repository) CreateAdminAccount(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount) (*models.AdminAccountDetail, error) {
	var detail models.AdminAccountDetail
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(emp).Error; err != nil {
			return err
		}

		acc.EmployeeID = emp.ID
		if err := tx.Create(acc).Error; err != nil {
			return err
		}

		var role models.OrgRole
		err := tx.Where("code = ? AND (organization_id = ? OR organization_id IS NULL)", "ORG_ADMIN", acc.OrganizationID).
			Order("organization_id DESC NULLS LAST").
			First(&role).Error
		if err != nil {
			return fmt.Errorf("ORG_ADMIN role not found: %w", err)
		}

		userRole := models.OrgUserRole{
			AccountID: acc.ID,
			RoleID:    role.ID,
		}
		if err := tx.Create(&userRole).Error; err != nil {
			return err
		}

		detail = models.AdminAccountDetail{
			AccountID:      acc.ID,
			OrganizationID: acc.OrganizationID,
			EmployeeID:     emp.ID,
			Identifier:     acc.Identifier,
			EmployeeCode:   emp.EmployeeCode,
			FirstName:      emp.FirstName,
			LastName:       emp.LastName,
			Email:          emp.Email,
			RoleCode:       role.Code,
			RoleName:       role.Name,
			Status:         acc.Status,
			LastLoginAt:    acc.LastLoginAt,
			CreatedAt:      acc.CreatedAt,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &detail, nil
}

func (r *repository) ListAdminAccounts(ctx context.Context, orgID string, q request.ListAdminAccountsQuery) ([]models.AdminAccountDetail, error) {
	var details []models.AdminAccountDetail
	db := r.db.WithContext(ctx).Table("organization_accounts oa").
		Select(`oa.id as account_id, oa.organization_id, oa.employee_id, oa.identifier,
		        ei.employee_code, ei.first_name, ei.last_name, ei.email,
		        r.code as role_code, r.name as role_name, oa.status, oa.last_login_at, oa.created_at`).
		Joins("JOIN employee_identities ei ON ei.id = oa.employee_id").
		Joins("JOIN org_user_roles our ON our.account_id = oa.id").
		Joins("JOIN org_roles r ON r.id = our.role_id").
		Where("oa.organization_id = ? AND r.code = ?", orgID, "ORG_ADMIN")
	err := sorting.Apply(db, q.SortBy, q.Orders(), sorting.Options{
		Allowed: map[string]string{
			"employeecode":  "ei.employee_code",
			"employee_code": "ei.employee_code",
			"firstname":     "ei.first_name",
			"first_name":    "ei.first_name",
			"lastname":      "ei.last_name",
			"last_name":     "ei.last_name",
			"identifier":    "oa.identifier",
			"status":        "oa.status",
			"createdat":     "oa.created_at",
			"created_at":    "oa.created_at",
		},
		Default:      "oa.created_at DESC",
		DefaultOrder: "DESC",
	}).Scan(&details).Error
	return details, err
}

func (r *repository) FindEmployeeByCode(ctx context.Context, orgID string, code string) (*models.EmployeeIdentity, error) {
	var emp models.EmployeeIdentity
	err := r.db.WithContext(ctx).Where("organization_id = ? AND LOWER(employee_code) = LOWER(?)", orgID, code).First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *repository) FindAccountByIdentifier(ctx context.Context, orgID string, identifier string) (*models.OrganizationAccount, error) {
	var acc models.OrganizationAccount
	err := r.db.WithContext(ctx).Where("organization_id = ? AND LOWER(identifier) = LOWER(?)", orgID, identifier).First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}
