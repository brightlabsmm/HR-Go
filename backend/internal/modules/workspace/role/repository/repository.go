package repository

import (
	"context"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/role/models"
	"hrgo/backend/internal/modules/workspace/role/request"
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type Repository interface {
	ListRoles(ctx context.Context, orgID string, q request.ListRolesQuery) ([]models.OrgRole, error)
	AccountBelongsToOrg(ctx context.Context, orgID, accountID string) (bool, error)
	ReplaceAccountRoles(ctx context.Context, orgID, accountID string, assignments []request.RoleAssignmentInput) error
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) ListRoles(ctx context.Context, orgID string, q request.ListRolesQuery) ([]models.OrgRole, error) {
	var roles []models.OrgRole
	db := r.db.WithContext(ctx).
		Preload("Permissions", func(db *gorm.DB) *gorm.DB {
			return db.Order("grouping ASC, resource ASC, action ASC")
		}).
		Where("organization_id IS NULL OR organization_id = ?", orgID)
	roleFilterCols := map[string]string{
		"name":       "name",
		"code":       "code",
		"issystem":   "is_system",
		"is_system":  "is_system",
		"createdat":  "created_at",
		"created_at": "created_at",
	}
	db = filtering.Apply(db, q.Filter, filtering.Options{Allowed: roleFilterCols})
	err := sorting.Apply(db, q.SortBy, q.Orders(), sorting.Options{
		Allowed:      roleFilterCols,
		Default:      "is_system DESC, name ASC",
		DefaultOrder: "ASC",
	}).Find(&roles).Error
	return roles, err
}

func (r *repository) AccountBelongsToOrg(ctx context.Context, orgID, accountID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("organization_accounts").
		Where("organization_id = ? AND id = ?", orgID, accountID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ReplaceAccountRoles(ctx context.Context, orgID, accountID string, assignments []request.RoleAssignmentInput) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("account_id = ?", accountID).Delete(&models.OrgUserRole{}).Error; err != nil {
			return err
		}

		for _, a := range assignments {
			ur := models.OrgUserRole{
				AccountID:    accountID,
				RoleID:       a.RoleID,
				BranchID:     a.BranchID,
				DepartmentID: a.DepartmentID,
			}
			if err := tx.Create(&ur).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
