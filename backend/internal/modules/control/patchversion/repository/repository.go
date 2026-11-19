package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/control/patchversion/models"
)

// ErrNoCurrent means migrations have not seeded a current patch version.
var ErrNoCurrent = errors.New("no current application patch version; apply database migrations before pushing")

// Repository reads and bumps application patch versions.
type Repository interface {
	FindCurrent(ctx context.Context) (*models.ApplicationPatchVersion, error)
	Bump(ctx context.Context, now time.Time) (*models.ApplicationPatchVersion, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) FindCurrent(ctx context.Context) (*models.ApplicationPatchVersion, error) {
	var row models.ApplicationPatchVersion
	err := r.db.WithContext(ctx).Where("is_current = ?", true).Take(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// Bump locks the current row, clears it, and inserts the next version as current.
func (r *repository) Bump(ctx context.Context, now time.Time) (*models.ApplicationPatchVersion, error) {
	var created models.ApplicationPatchVersion
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var current models.ApplicationPatchVersion
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("is_current = ?", true).
			Take(&current).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNoCurrent
		}
		if err != nil {
			return err
		}

		next, err := NextPatchVersion(current.PatchVersion)
		if err != nil {
			return err
		}

		if err := tx.Exec(
			`UPDATE application_patch_versions SET is_current = FALSE, updated_at = CURRENT_TIMESTAMP WHERE is_current = TRUE`,
		).Error; err != nil {
			return err
		}

		created = models.ApplicationPatchVersion{
			ID:            uuid.NewString(),
			PatchVersion:  next,
			PatchDateTime: now.UTC(),
			IsCurrent:     true,
			CreatedAt:     now.UTC(),
			UpdatedAt:     now.UTC(),
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}
