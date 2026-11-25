package repository

import (
	"context"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/overtime/models"
	"hrgo/backend/internal/modules/workspace/overtime/request"
)

type CategoryWithRule struct {
	models.OvertimeCategory
	MinMinutes          int  `gorm:"column:min_minutes"`
	MaxDailyMinutes     int  `gorm:"column:max_daily_minutes"`
	RequiresPreApproval bool `gorm:"column:requires_pre_approval"`
}

type Repository interface {
	ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error)
	ListCategories(ctx context.Context, orgID string, activeOnly bool) ([]CategoryWithRule, error)
	FindCategoryByID(ctx context.Context, orgID, id string) (*CategoryWithRule, error)
	CreateCategoryWithRule(ctx context.Context, cat *models.OvertimeCategory, rule *models.OvertimeRule) error

	ListRequests(ctx context.Context, orgID string, q request.ListOvertimeRequestsQuery) ([]models.OvertimeRequest, int64, error)
	FindRequestByID(ctx context.Context, orgID, id string) (*models.OvertimeRequest, error)
	CreateRequest(ctx context.Context, req *models.OvertimeRequest) error
	ReviewRequestTx(ctx context.Context, orgID string, ot *models.OvertimeRequest, approval *models.OvertimeApproval, entry *models.OvertimeEntry) error
	ListEntries(ctx context.Context, orgID, employeeID string) ([]models.OvertimeEntry, error)
}

type repo struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repo{db: db}
}

func (r *repo) ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table("employee_identities").
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", employeeID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repo) ListCategories(ctx context.Context, orgID string, activeOnly bool) ([]CategoryWithRule, error) {
	tx := r.db.WithContext(ctx).
		Table("overtime_categories oc").
		Select("oc.*, COALESCE(r.min_minutes, 30) AS min_minutes, COALESCE(r.max_daily_minutes, 480) AS max_daily_minutes, COALESCE(r.requires_pre_approval, TRUE) AS requires_pre_approval").
		Joins("LEFT JOIN overtime_rules r ON r.overtime_category_id = oc.id").
		Where("oc.organization_id = ? AND oc.deleted_at IS NULL", orgID)
	if activeOnly {
		tx = tx.Where("oc.status = 'ACTIVE'")
	}
	var items []CategoryWithRule
	err := tx.Order("oc.name ASC").Scan(&items).Error
	return items, err
}

func (r *repo) FindCategoryByID(ctx context.Context, orgID, id string) (*CategoryWithRule, error) {
	var item CategoryWithRule
	err := r.db.WithContext(ctx).
		Table("overtime_categories oc").
		Select("oc.*, COALESCE(r.min_minutes, 30) AS min_minutes, COALESCE(r.max_daily_minutes, 480) AS max_daily_minutes, COALESCE(r.requires_pre_approval, TRUE) AS requires_pre_approval").
		Joins("LEFT JOIN overtime_rules r ON r.overtime_category_id = oc.id").
		Where("oc.id = ? AND oc.organization_id = ? AND oc.deleted_at IS NULL", id, orgID).
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *repo) CreateCategoryWithRule(ctx context.Context, cat *models.OvertimeCategory, rule *models.OvertimeRule) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(cat).Error; err != nil {
			return err
		}
		rule.OrganizationID = cat.OrganizationID
		rule.OvertimeCategoryID = cat.ID
		return tx.Create(rule).Error
	})
}

func (r *repo) ListRequests(ctx context.Context, orgID string, q request.ListOvertimeRequestsQuery) ([]models.OvertimeRequest, int64, error) {
	tx := r.db.WithContext(ctx).
		Table("overtime_requests ot").
		Select(`ot.*,
			e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			oc.code AS category_code,
			oc.name AS category_name,
			oc.rate_multiplier AS multiplier,
			oa.remarks AS decision_notes`).
		Joins("JOIN employee_identities e ON e.id = ot.employee_id").
		Joins("JOIN overtime_categories oc ON oc.id = ot.overtime_category_id").
		Joins("LEFT JOIN LATERAL (SELECT remarks FROM overtime_approvals WHERE overtime_request_id = ot.id ORDER BY decided_at DESC LIMIT 1) oa ON TRUE").
		Where("ot.organization_id = ?", orgID)

	if q.Status != "" {
		tx = tx.Where("ot.request_status = ?", q.Status)
	}
	if q.EmployeeID != "" {
		tx = tx.Where("ot.employee_id = ?", q.EmployeeID)
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page <= 0 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	var items []models.OvertimeRequest
	err := tx.Order("ot.work_date DESC, ot.created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&items).Error
	return items, total, err
}

func (r *repo) FindRequestByID(ctx context.Context, orgID, id string) (*models.OvertimeRequest, error) {
	var item models.OvertimeRequest
	err := r.db.WithContext(ctx).
		Table("overtime_requests ot").
		Select(`ot.*,
			e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			oc.code AS category_code,
			oc.name AS category_name,
			oc.rate_multiplier AS multiplier`).
		Joins("JOIN employee_identities e ON e.id = ot.employee_id").
		Joins("JOIN overtime_categories oc ON oc.id = ot.overtime_category_id").
		Where("ot.id = ? AND ot.organization_id = ?", id, orgID).
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *repo) CreateRequest(ctx context.Context, req *models.OvertimeRequest) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *repo) ReviewRequestTx(ctx context.Context, orgID string, ot *models.OvertimeRequest, approval *models.OvertimeApproval, entry *models.OvertimeEntry) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		if err := tx.Table("overtime_requests").
			Where("id = ? AND organization_id = ?", ot.ID, orgID).
			Updates(map[string]any{
				"request_status": ot.RequestStatus,
				"updated_at":     now,
			}).Error; err != nil {
			return err
		}
		if err := tx.Create(approval).Error; err != nil {
			return err
		}
		if entry != nil {
			return tx.Create(entry).Error
		}
		return nil
	})
}

func (r *repo) ListEntries(ctx context.Context, orgID, employeeID string) ([]models.OvertimeEntry, error) {
	tx := r.db.WithContext(ctx).Where("organization_id = ?", orgID)
	if employeeID != "" {
		tx = tx.Where("employee_id = ?", employeeID)
	}
	var items []models.OvertimeEntry
	err := tx.Order("work_date DESC").Find(&items).Error
	return items, err
}
