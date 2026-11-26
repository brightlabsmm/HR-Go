package repository

import (
	"context"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/auditlog/models"
	"hrgo/backend/internal/modules/workspace/auditlog/request"
)

type Repository interface {
	List(ctx context.Context, orgID string, q request.ListAuditLogsQuery) ([]models.AuditLog, int64, error)
}

type repo struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repo{db: db}
}

func (r *repo) List(ctx context.Context, orgID string, q request.ListAuditLogsQuery) ([]models.AuditLog, int64, error) {
	tx := r.db.WithContext(ctx).Table("audit_logs a").
		Select(`a.*,
			COALESCE(
				NULLIF(TRIM(CONCAT(ei.first_name, ' ', ei.last_name)), ''),
				oa.identifier,
				pu.full_name
			) AS actor_name,
			COALESCE(NULLIF(ei.employee_code, ''), oa.identifier) AS actor_code`).
		Joins("LEFT JOIN organization_accounts oa ON oa.id = a.actor_id").
		Joins("LEFT JOIN employee_identities ei ON ei.id = oa.employee_id").
		Joins("LEFT JOIN platform_users pu ON pu.id = a.actor_id").
		Where("a.organization_id = ?", orgID)

	if q.EntityName != "" {
		tx = tx.Where("LOWER(a.entity_name) LIKE LOWER(?)", "%"+q.EntityName+"%")
	}
	if q.Action != "" {
		tx = tx.Where("LOWER(a.action) LIKE LOWER(?)", "%"+q.Action+"%")
	}
	if q.ActorID != "" {
		tx = tx.Where("a.actor_id = ?", q.ActorID)
	}
	if q.From != "" {
		tx = tx.Where("a.created_at >= ?", q.From)
	}
	if q.To != "" {
		tx = tx.Where("a.created_at <= ?", q.To)
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

	var items []models.AuditLog
	if err := tx.Order("a.created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}
