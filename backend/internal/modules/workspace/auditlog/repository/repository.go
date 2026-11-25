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
	tx := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("organization_id = ?", orgID)

	if q.EntityName != "" {
		tx = tx.Where("entity_name = ?", q.EntityName)
	}
	if q.Action != "" {
		tx = tx.Where("action = ?", q.Action)
	}
	if q.ActorID != "" {
		tx = tx.Where("actor_id = ?", q.ActorID)
	}
	if q.From != "" {
		tx = tx.Where("created_at >= ?", q.From)
	}
	if q.To != "" {
		tx = tx.Where("created_at <= ?", q.To)
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
	if err := tx.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}
