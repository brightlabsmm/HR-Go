package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"hrgo/backend/internal/modules/workspace/employee/models"
	"hrgo/backend/internal/modules/workspace/employee/request"
)

type Repository interface {
	Create(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, account *models.OrganizationAccount) error
	GetNextEmployeeCode(ctx context.Context, orgID string) (string, error)
	FindByID(ctx context.Context, orgID, id string) (*models.Employee, error)
	FindByCode(ctx context.Context, orgID, code string) (*models.Employee, error)
	FindByEmail(ctx context.Context, orgID, email string) (*models.Employee, error)
	List(ctx context.Context, orgID string, q request.ListEmployeesQuery) ([]models.Employee, int64, error)
	Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile) error
	SoftDelete(ctx context.Context, orgID, id string) error
	GetProfile(ctx context.Context, orgID, employeeID string) (*models.EmployeeProfile, error)
	AddPositionHistory(ctx context.Context, history *models.EmployeePositionHistory) error
	ListPositionHistory(ctx context.Context, orgID, employeeID string) ([]models.EmployeePositionHistory, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, account *models.OrganizationAccount) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(emp).Error; err != nil {
			return err
		}
		if profile != nil {
			profile.EmployeeID = emp.ID
			profile.OrganizationID = emp.OrganizationID
			if err := tx.Create(profile).Error; err != nil {
				return err
			}
		}
		if account != nil {
			account.EmployeeID = emp.ID
			account.OrganizationID = emp.OrganizationID
			if err := tx.Create(account).Error; err != nil {
				return err
			}

			// Assign default EMPLOYEE role if present in org_roles
			var role struct{ ID string }
			if err := tx.Table("org_roles").
				Select("id").
				Where("code = 'EMPLOYEE' AND (organization_id IS NULL OR organization_id = ?)", emp.OrganizationID).
				First(&role).Error; err == nil && role.ID != "" {
				_ = tx.Exec("INSERT INTO org_user_roles (account_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING", account.ID, role.ID).Error
			}
		}
		if emp.PositionID != nil && *emp.PositionID != "" {
			history := models.EmployeePositionHistory{
				OrganizationID: emp.OrganizationID,
				EmployeeID:     emp.ID,
				NewPositionID:  *emp.PositionID,
				EffectiveDate:  time.Now().UTC(),
			}
			if emp.DateOfJoining != nil {
				history.EffectiveDate = *emp.DateOfJoining
			}
			_ = tx.Create(&history).Error
		}
		return nil
	})
}

func (r *repository) GetNextEmployeeCode(ctx context.Context, orgID string) (string, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Employee{}).
		Where("organization_id = ?", orgID).
		Count(&count).Error; err != nil {
		return "", err
	}

	seq := count + 1
	for i := 0; i < 100; i++ {
		candidate := fmt.Sprintf("EMP-%03d", seq)
		var existingCount int64
		if err := r.db.WithContext(ctx).Model(&models.Employee{}).
			Where("organization_id = ? AND LOWER(employee_code) = LOWER(?)", orgID, candidate).
			Count(&existingCount).Error; err != nil {
			return "", err
		}
		if existingCount == 0 {
			return candidate, nil
		}
		seq++
	}

	return fmt.Sprintf("EMP-%d", time.Now().Unix()%100000), nil
}

func (r *repository) FindByID(ctx context.Context, orgID, id string) (*models.Employee, error) {
	var emp models.Employee
	err := r.db.WithContext(ctx).Table("employee_identities e").
		Select("e.*, b.name as branch_name, d.name as department_name, p.name as position_title").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN positions p ON p.id = e.position_id").
		Where("e.id = ? AND e.organization_id = ? AND e.deleted_at IS NULL", id, orgID).
		First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *repository) FindByCode(ctx context.Context, orgID, code string) (*models.Employee, error) {
	var emp models.Employee
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND LOWER(employee_code) = LOWER(?) AND deleted_at IS NULL", orgID, strings.TrimSpace(code)).
		First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *repository) FindByEmail(ctx context.Context, orgID, email string) (*models.Employee, error) {
	var emp models.Employee
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND LOWER(email) = LOWER(?) AND deleted_at IS NULL", orgID, strings.TrimSpace(email)).
		First(&emp).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &emp, nil
}

func (r *repository) List(ctx context.Context, orgID string, q request.ListEmployeesQuery) ([]models.Employee, int64, error) {
	query := r.db.WithContext(ctx).Table("employee_identities e").
		Select("e.*, b.name as branch_name, d.name as department_name, p.name as position_title").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN positions p ON p.id = e.position_id").
		Where("e.organization_id = ? AND e.deleted_at IS NULL", orgID)

	if q.BranchID != "" {
		query = query.Where("e.branch_id = ?", q.BranchID)
	}
	if q.DepartmentID != "" {
		query = query.Where("e.department_id = ?", q.DepartmentID)
	}
	if q.PositionID != "" {
		query = query.Where("e.position_id = ?", q.PositionID)
	}
	if q.Status != "" {
		query = query.Where("LOWER(e.employment_status) = LOWER(?)", q.Status)
	}
	if q.Q != "" {
		search := "%" + strings.ToLower(strings.TrimSpace(q.Q)) + "%"
		query = query.Where("(LOWER(e.employee_code) LIKE ? OR LOWER(e.first_name) LIKE ? OR LOWER(e.last_name) LIKE ? OR LOWER(e.email) LIKE ?)", search, search, search, search)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	var items []models.Employee
	if err := query.Order("e.created_at DESC").Offset(offset).Limit(pageSize).Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *repository) Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(emp).Error; err != nil {
			return err
		}
		if profile != nil {
			profile.EmployeeID = emp.ID
			profile.OrganizationID = emp.OrganizationID
			var existing models.EmployeeProfile
			err := tx.Where("employee_id = ?", emp.ID).First(&existing).Error
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					if err := tx.Create(profile).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			} else {
				profile.ID = existing.ID
				profile.CreatedAt = existing.CreatedAt
				if err := tx.Save(profile).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *repository) SoftDelete(ctx context.Context, orgID, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&models.Employee{}).
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", id, orgID).
		Updates(map[string]any{
			"deleted_at":        now,
			"employment_status": "TERMINATED",
			"updated_at":        now,
		}).Error
}

func (r *repository) GetProfile(ctx context.Context, orgID, employeeID string) (*models.EmployeeProfile, error) {
	var profile models.EmployeeProfile
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ?", orgID, employeeID).
		First(&profile).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}

func (r *repository) AddPositionHistory(ctx context.Context, history *models.EmployeePositionHistory) error {
	return r.db.WithContext(ctx).Create(history).Error
}

func (r *repository) ListPositionHistory(ctx context.Context, orgID, employeeID string) ([]models.EmployeePositionHistory, error) {
	var items []models.EmployeePositionHistory
	err := r.db.WithContext(ctx).Table("employee_position_histories h").
		Select("h.*, p_old.name as old_position_title, p_new.name as new_position_title").
		Joins("LEFT JOIN positions p_old ON p_old.id = h.old_position_id").
		Joins("LEFT JOIN positions p_new ON p_new.id = h.new_position_id").
		Where("h.organization_id = ? AND h.employee_id = ?", orgID, employeeID).
		Order("h.effective_date DESC, h.created_at DESC").
		Scan(&items).Error
	return items, err
}
