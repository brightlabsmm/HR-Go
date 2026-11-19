package repository

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/branch/models"
	"hrgo/backend/internal/modules/workspace/branch/request"
	"hrgo/backend/internal/shared/codeformat"
	"hrgo/backend/internal/shared/filtering"
	"hrgo/backend/internal/shared/sorting"
)

type Repository interface {
	Create(ctx context.Context, b *models.Branch) error
	FindByID(ctx context.Context, orgID, id string) (*models.Branch, error)
	FindByCode(ctx context.Context, orgID, code string) (*models.Branch, error)
	Update(ctx context.Context, b *models.Branch) error
	List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]models.Branch, int64, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, b *models.Branch) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		format := codeformat.DefaultBranchCodeFormat

		var settingVal string
		err := tx.Table("organization_settings").
			Select("setting_value").
			Where("organization_id = ? AND setting_key = ?", b.OrganizationID, codeformat.SettingKeyBranchCodeFormat).
			Scan(&settingVal).Error
		if err == nil && strings.TrimSpace(settingVal) != "" {
			format = strings.TrimSpace(settingVal)
		} else {
			_ = tx.Exec(`
				INSERT INTO organization_settings (organization_id, setting_key, setting_value)
				VALUES (?, ?, ?)
				ON CONFLICT (organization_id, setting_key) DO NOTHING
			`, b.OrganizationID, codeformat.SettingKeyBranchCodeFormat, codeformat.DefaultBranchCodeFormat).Error
		}

		var count int64
		if err := tx.Model(&models.Branch{}).Where("organization_id = ?", b.OrganizationID).Count(&count).Error; err != nil {
			return err
		}

		seq := int(count) + 1
		for {
			candidate := codeformat.Format(format, seq, codeformat.DefaultBranchCodeFormat)
			var existingCount int64
			if err := tx.Model(&models.Branch{}).
				Where("organization_id = ? AND LOWER(code) = LOWER(?)", b.OrganizationID, candidate).
				Count(&existingCount).Error; err != nil {
				return err
			}
			if existingCount == 0 {
				b.Code = candidate
				break
			}
			seq++
		}

		return tx.Create(b).Error
	})
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.Branch, error) {
	var b models.Branch
	err := r.db.WithContext(ctx).Where("organization_id = ? AND id = ?", orgID, id).First(&b).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func (r *repository) FindByCode(ctx context.Context, orgID, code string) (*models.Branch, error) {
	var b models.Branch
	err := r.db.WithContext(ctx).Where("organization_id = ? AND LOWER(code) = LOWER(?)", orgID, code).First(&b).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func (r *repository) Update(ctx context.Context, b *models.Branch) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListBranchesQuery) ([]models.Branch, int64, error) {
	db := r.db.WithContext(ctx).Model(&models.Branch{}).Where("organization_id = ?", orgID)

	if term := strings.TrimSpace(q.Q); term != "" {
		like := "%" + strings.ToLower(term) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(code) LIKE ?", like, like)
	}
	if status := strings.TrimSpace(q.Status); status != "" {
		db = db.Where("status = ?", status)
	}

	branchFilterCols := map[string]string{
		"name":       "name",
		"code":       "code",
		"address":    "address",
		"status":     "status",
		"parentid":   "parent_id",
		"parent_id":  "parent_id",
		"createdat":  "created_at",
		"created_at": "created_at",
		"updatedat":  "updated_at",
		"updated_at": "updated_at",
	}
	db = filtering.Apply(db, q.Filter, filtering.Options{Allowed: branchFilterCols})

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var list []models.Branch
	err := sorting.Apply(db, q.SortBy, q.Orders(), sorting.Options{
		Allowed: map[string]string{
			"name":       "name",
			"code":       "code",
			"status":     "status",
			"createdat":  "created_at",
			"created_at": "created_at",
		},
		Default:      "created_at DESC",
		DefaultOrder: "DESC",
	}).
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error
	return list, total, err
}
