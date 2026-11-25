package repository

import (
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/workspace/branchhours/models"
)

type Repository interface {
	ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error)
	ListByBranch(ctx context.Context, orgID, branchID string) ([]models.BranchOperatingHour, error)
	ReplaceForBranch(ctx context.Context, orgID, branchID string, items []models.BranchOperatingHour) ([]models.BranchOperatingHour, error)
}

type repo struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repo{db: db}
}

func (r *repo) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table("branches").
		Where("id = ? AND organization_id = ?", branchID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repo) ListByBranch(ctx context.Context, orgID, branchID string) ([]models.BranchOperatingHour, error) {
	var items []models.BranchOperatingHour
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND branch_id = ?", orgID, branchID).
		Order("CASE day_of_week WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3 WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 WHEN 'SATURDAY' THEN 6 WHEN 'SUNDAY' THEN 7 ELSE 8 END ASC").
		Find(&items).Error
	return items, err
}

func (r *repo) ReplaceForBranch(ctx context.Context, orgID, branchID string, items []models.BranchOperatingHour) ([]models.BranchOperatingHour, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		for i := range items {
			items[i].OrganizationID = orgID
			items[i].BranchID = branchID
			items[i].UpdatedAt = now
			if err := tx.Clauses(clause.OnConflict{
				Columns: []clause.Column{{Name: "branch_id"}, {Name: "day_of_week"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"opening_time", "closing_time", "is_closed", "updated_at",
				}),
			}).Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return r.ListByBranch(ctx, orgID, branchID)
}
