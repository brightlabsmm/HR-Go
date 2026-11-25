package repository

import (
	"context"
	"encoding/json"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/workspace/lifecycle/models"
)

type EmployeeSnapshotSource struct {
	EmployeeID    string
	DateOfJoining *time.Time
	Status        string
	EmployeeJSON  json.RawMessage
	ProfileJSON   json.RawMessage
}

type Repository interface {
	ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error)
	GetEmployeeSnapshotSource(ctx context.Context, orgID, employeeID string) (*EmployeeSnapshotSource, error)

	ListContracts(ctx context.Context, orgID, employeeID string) ([]models.EmploymentContract, error)
	FindContractByID(ctx context.Context, orgID, employeeID, contractID string) (*models.EmploymentContract, error)
	CreateContract(ctx context.Context, m *models.EmploymentContract) error
	UpdateContract(ctx context.Context, m *models.EmploymentContract) error
	SoftDeleteContract(ctx context.Context, orgID, employeeID, contractID string) error

	ListDocuments(ctx context.Context, orgID, employeeID string) ([]models.EmployeeDocument, error)
	FindDocumentByID(ctx context.Context, orgID, employeeID, documentID string) (*models.EmployeeDocument, error)
	CreateDocument(ctx context.Context, m *models.EmployeeDocument) error
	SoftDeleteDocument(ctx context.Context, orgID, employeeID, documentID string) error

	ListServiceYears(ctx context.Context, orgID, employeeID string) ([]models.EmployeeServiceYear, error)
	UpsertServiceYear(ctx context.Context, m *models.EmployeeServiceYear) error

	ListExitRecords(ctx context.Context, orgID, employeeID string) ([]models.EmployeeExitRecord, error)
	ListHistories(ctx context.Context, orgID, employeeID string) ([]models.EmployeeHistory, error)
	RecordExitWithSnapshot(
		ctx context.Context,
		exit *models.EmployeeExitRecord,
		hist *models.EmployeeHistory,
		newEmploymentStatus string,
	) error
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

func (r *repo) GetEmployeeSnapshotSource(ctx context.Context, orgID, employeeID string) (*EmployeeSnapshotSource, error) {
	var empRow map[string]any
	if err := r.db.WithContext(ctx).
		Table("employee_identities").
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", employeeID, orgID).
		Take(&empRow).Error; err != nil {
		return nil, err
	}

	var profRow map[string]any
	_ = r.db.WithContext(ctx).
		Table("employee_profiles").
		Where("employee_id = ? AND organization_id = ?", employeeID, orgID).
		Take(&profRow).Error

	empBytes, err := json.Marshal(empRow)
	if err != nil {
		return nil, err
	}
	var profBytes []byte
	if len(profRow) > 0 {
		profBytes, _ = json.Marshal(profRow)
	}

	src := &EmployeeSnapshotSource{
		EmployeeID:   employeeID,
		EmployeeJSON: empBytes,
		ProfileJSON:  profBytes,
	}
	if v, ok := empRow["employment_status"].(string); ok {
		src.Status = v
	}
	switch dt := empRow["date_of_joining"].(type) {
	case time.Time:
		src.DateOfJoining = &dt
	case string:
		if parsed, parseErr := time.Parse("2006-01-02", dt); parseErr == nil {
			src.DateOfJoining = &parsed
		}
	}
	return src, nil
}

func (r *repo) ListContracts(ctx context.Context, orgID, employeeID string) ([]models.EmploymentContract, error) {
	var items []models.EmploymentContract
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND deleted_at IS NULL", orgID, employeeID).
		Order("start_date DESC").
		Find(&items).Error
	return items, err
}

func (r *repo) FindContractByID(ctx context.Context, orgID, employeeID, contractID string) (*models.EmploymentContract, error) {
	var item models.EmploymentContract
	err := r.db.WithContext(ctx).
		Where("id = ? AND organization_id = ? AND employee_id = ? AND deleted_at IS NULL", contractID, orgID, employeeID).
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *repo) CreateContract(ctx context.Context, m *models.EmploymentContract) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *repo) UpdateContract(ctx context.Context, m *models.EmploymentContract) error {
	return r.db.WithContext(ctx).Save(m).Error
}

func (r *repo) SoftDeleteContract(ctx context.Context, orgID, employeeID, contractID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.EmploymentContract{}).
		Where("id = ? AND organization_id = ? AND employee_id = ? AND deleted_at IS NULL", contractID, orgID, employeeID).
		Updates(map[string]any{"deleted_at": now, "updated_at": now}).Error
}

func (r *repo) ListDocuments(ctx context.Context, orgID, employeeID string) ([]models.EmployeeDocument, error) {
	var items []models.EmployeeDocument
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND deleted_at IS NULL", orgID, employeeID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *repo) FindDocumentByID(ctx context.Context, orgID, employeeID, documentID string) (*models.EmployeeDocument, error) {
	var item models.EmployeeDocument
	err := r.db.WithContext(ctx).
		Where("id = ? AND organization_id = ? AND employee_id = ? AND deleted_at IS NULL", documentID, orgID, employeeID).
		Take(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *repo) CreateDocument(ctx context.Context, m *models.EmployeeDocument) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *repo) SoftDeleteDocument(ctx context.Context, orgID, employeeID, documentID string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).
		Model(&models.EmployeeDocument{}).
		Where("id = ? AND organization_id = ? AND employee_id = ? AND deleted_at IS NULL", documentID, orgID, employeeID).
		Updates(map[string]any{"deleted_at": now, "updated_at": now}).Error
}

func (r *repo) ListServiceYears(ctx context.Context, orgID, employeeID string) ([]models.EmployeeServiceYear, error) {
	var items []models.EmployeeServiceYear
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ?", orgID, employeeID).
		Order("calculation_date DESC").
		Find(&items).Error
	return items, err
}

func (r *repo) UpsertServiceYear(ctx context.Context, m *models.EmployeeServiceYear) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "employee_id"}, {Name: "calculation_date"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"service_years", "updated_at",
		}),
	}).Create(m).Error
}

func (r *repo) ListExitRecords(ctx context.Context, orgID, employeeID string) ([]models.EmployeeExitRecord, error) {
	var items []models.EmployeeExitRecord
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ?", orgID, employeeID).
		Order("effective_date DESC").
		Find(&items).Error
	return items, err
}

func (r *repo) ListHistories(ctx context.Context, orgID, employeeID string) ([]models.EmployeeHistory, error) {
	var items []models.EmployeeHistory
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ?", orgID, employeeID).
		Order("snapshot_at DESC").
		Find(&items).Error
	return items, err
}

func (r *repo) RecordExitWithSnapshot(
	ctx context.Context,
	exit *models.EmployeeExitRecord,
	hist *models.EmployeeHistory,
	newEmploymentStatus string,
) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		if err := tx.Create(exit).Error; err != nil {
			return err
		}

		hist.ExitRecordID = &exit.ID
		if err := tx.Create(hist).Error; err != nil {
			return err
		}

		if err := tx.Table("employee_identities").
			Where("id = ? AND organization_id = ?", exit.EmployeeID, exit.OrganizationID).
			Updates(map[string]any{
				"employment_status": newEmploymentStatus,
				"updated_at":        now,
			}).Error; err != nil {
			return err
		}

		var accountIDs []string
		if err := tx.Table("organization_accounts").
			Where("employee_id = ? AND organization_id = ?", exit.EmployeeID, exit.OrganizationID).
			Pluck("id", &accountIDs).Error; err != nil {
			return err
		}

		if len(accountIDs) > 0 {
			if err := tx.Table("organization_accounts").
				Where("id IN ?", accountIDs).
				Updates(map[string]any{
					"status":                "INACTIVE",
					"is_current":            false,
					"mobile_access_enabled": false,
					"updated_at":            now,
				}).Error; err != nil {
				return err
			}

			if err := tx.Table("workspace_sessions").
				Where("account_id IN ? AND revoked_at IS NULL", accountIDs).
				Update("revoked_at", now).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
