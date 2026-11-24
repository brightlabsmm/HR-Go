package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/user/models"
	"hrgo/backend/internal/modules/workspace/user/request"
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type Repository interface {
	List(ctx context.Context, orgID string, q request.ListUsersQuery) ([]models.OrganizationAccount, int64, error)
	FindByID(ctx context.Context, orgID, id string) (*models.OrganizationAccount, error)
	FindByEmailOrIdentifier(ctx context.Context, orgID, email, identifier string) (*models.OrganizationAccount, error)
	Create(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount, roleIDs []string) (*models.OrganizationAccount, error)
	Update(ctx context.Context, orgID, id string, fullName, email *string) (*models.OrganizationAccount, error)
	ReplaceRoles(ctx context.Context, orgID, id string, roleIDs []string) (*models.OrganizationAccount, error)
	SetStatus(ctx context.Context, orgID, id, status string) (*models.OrganizationAccount, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListUsersQuery) ([]models.OrganizationAccount, int64, error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	base := r.db.WithContext(ctx).
		Model(&models.OrganizationAccount{}).
		Joins("JOIN employee_identities ON employee_identities.id = organization_accounts.employee_id").
		Where("organization_accounts.organization_id = ?", orgID)

	if q.Q != "" {
		like := "%" + q.Q + "%"
		base = base.Where(
			"organization_accounts.identifier ILIKE ? OR employee_identities.first_name ILIKE ? OR employee_identities.last_name ILIKE ? OR employee_identities.email ILIKE ?",
			like, like, like, like,
		)
	}

	if q.Status != "" {
		base = base.Where("organization_accounts.status = ?", strings.ToUpper(q.Status))
	}

	allowedCols := map[string]string{
		"name":       "employee_identities.first_name",
		"email":      "employee_identities.email",
		"status":     "organization_accounts.status",
		"createdat":  "organization_accounts.created_at",
		"created_at": "organization_accounts.created_at",
	}
	base = filtering.Apply(base, q.Filter, filtering.Options{Allowed: allowedCols})

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var accounts []models.OrganizationAccount
	db := sorting.Apply(base, q.SortBy, q.Orders(), sorting.Options{
		Allowed:      allowedCols,
		Default:      "organization_accounts.created_at DESC",
		DefaultOrder: "DESC",
	})

	err := db.
		Preload("Employee").
		Preload("UserRoles.Role").
		Limit(pageSize).
		Offset(offset).
		Find(&accounts).Error

	return accounts, total, err
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.OrganizationAccount, error) {
	var acc models.OrganizationAccount
	err := r.db.WithContext(ctx).
		Preload("Employee").
		Preload("UserRoles.Role").
		Where("organization_id = ? AND id = ?", orgID, id).
		First(&acc).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) FindByEmailOrIdentifier(ctx context.Context, orgID, email, identifier string) (*models.OrganizationAccount, error) {
	var acc models.OrganizationAccount
	db := r.db.WithContext(ctx).
		Joins("JOIN employee_identities ON employee_identities.id = organization_accounts.employee_id").
		Where("organization_accounts.organization_id = ?", orgID)

	if email != "" && identifier != "" {
		db = db.Where("LOWER(employee_identities.email) = LOWER(?) OR LOWER(organization_accounts.identifier) = LOWER(?)", email, identifier)
	} else if email != "" {
		db = db.Where("LOWER(employee_identities.email) = LOWER(?)", email)
	} else if identifier != "" {
		db = db.Where("LOWER(organization_accounts.identifier) = LOWER(?)", identifier)
	}

	err := db.First(&acc).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *repository) Create(ctx context.Context, emp *models.EmployeeIdentity, acc *models.OrganizationAccount, roleIDs []string) (*models.OrganizationAccount, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(emp).Error; err != nil {
			return err
		}

		acc.EmployeeID = emp.ID
		if err := tx.Create(acc).Error; err != nil {
			return err
		}

		for _, rID := range roleIDs {
			ur := models.OrgUserRole{
				AccountID: acc.ID,
				RoleID:    rID,
			}
			if err := tx.Create(&ur).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return r.FindByID(ctx, acc.OrganizationID, acc.ID)
}

func (r *repository) Update(ctx context.Context, orgID, id string, fullName, email *string) (*models.OrganizationAccount, error) {
	acc, err := r.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, gorm.ErrRecordNotFound
	}

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		empUpdates := map[string]interface{}{"updated_at": time.Now().UTC()}
		if fullName != nil {
			parts := strings.Fields(*fullName)
			firstName := *fullName
			lastName := ""
			if len(parts) > 1 {
				firstName = parts[0]
				lastName = strings.Join(parts[1:], " ")
			}
			empUpdates["first_name"] = firstName
			empUpdates["last_name"] = lastName
		}
		if email != nil {
			empUpdates["email"] = *email
		}

		if err := tx.Model(&models.EmployeeIdentity{}).Where("id = ?", acc.EmployeeID).Updates(empUpdates).Error; err != nil {
			return err
		}

		return tx.Model(&models.OrganizationAccount{}).Where("id = ?", id).Update("updated_at", time.Now().UTC()).Error
	})
	if err != nil {
		return nil, err
	}

	return r.FindByID(ctx, orgID, id)
}

func (r *repository) ReplaceRoles(ctx context.Context, orgID, id string, roleIDs []string) (*models.OrganizationAccount, error) {
	acc, err := r.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, gorm.ErrRecordNotFound
	}

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("account_id = ?", id).Delete(&models.OrgUserRole{}).Error; err != nil {
			return err
		}

		for _, rID := range roleIDs {
			ur := models.OrgUserRole{
				AccountID: id,
				RoleID:    rID,
			}
			if err := tx.Create(&ur).Error; err != nil {
				return fmt.Errorf("assign role: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return r.FindByID(ctx, orgID, id)
}

func (r *repository) SetStatus(ctx context.Context, orgID, id, status string) (*models.OrganizationAccount, error) {
	acc, err := r.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, gorm.ErrRecordNotFound
	}

	err = r.db.WithContext(ctx).
		Model(&models.OrganizationAccount{}).
		Where("id = ? AND organization_id = ?", id, orgID).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now().UTC(),
		}).Error
	if err != nil {
		return nil, err
	}

	return r.FindByID(ctx, orgID, id)
}
