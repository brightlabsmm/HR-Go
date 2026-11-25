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
	Create(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, account *models.OrganizationAccount, roleID *string) error
	GetNextEmployeeCode(ctx context.Context, orgID string) (string, error)
	FindByID(ctx context.Context, orgID, id string) (*models.Employee, error)
	FindByCode(ctx context.Context, orgID, code string) (*models.Employee, error)
	FindByEmail(ctx context.Context, orgID, email string) (*models.Employee, error)
	List(ctx context.Context, orgID string, q request.ListEmployeesQuery) ([]models.Employee, int64, error)
	Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, roleID *string, fallbackPassHash string) error
	SoftDelete(ctx context.Context, orgID, id string) error
	GetProfile(ctx context.Context, orgID, employeeID string) (*models.EmployeeProfile, error)
	AddPositionHistory(ctx context.Context, history *models.EmployeePositionHistory) error
	ListPositionHistory(ctx context.Context, orgID, employeeID string) ([]models.EmployeePositionHistory, error)
	ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error)
	ValidateDepartment(ctx context.Context, orgID, departmentID string) (bool, error)
	ValidatePosition(ctx context.Context, orgID, positionID string) (bool, error)
	ValidateRole(ctx context.Context, orgID, roleID string) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, account *models.OrganizationAccount, roleID *string) error {
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

			assignedRoleID := ""
			if roleID != nil && *roleID != "" {
				assignedRoleID = *roleID
			} else {
				// Assign default EMPLOYEE role if present in org_roles
				var role struct{ ID string }
				if err := tx.Table("org_roles").
					Select("id").
					Where("code = 'EMPLOYEE' AND (organization_id IS NULL OR organization_id = ?)", emp.OrganizationID).
					First(&role).Error; err == nil && role.ID != "" {
					assignedRoleID = role.ID
				}
			}

			if assignedRoleID != "" {
				if err := tx.Exec("INSERT INTO org_user_roles (account_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING", account.ID, assignedRoleID).Error; err != nil {
					return err
				}
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
			if err := tx.Create(&history).Error; err != nil {
				return err
			}
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
		Select("e.*, b.name as branch_name, d.name as department_name, p.name as position_title, r.role_id, r.role_name, r.role_code").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN positions p ON p.id = e.position_id").
		Joins("LEFT JOIN LATERAL (SELECT id FROM organization_accounts WHERE employee_id = e.id AND organization_id = e.organization_id ORDER BY (status = 'ACTIVE') DESC, created_at DESC LIMIT 1) oa ON true").
		Joins("LEFT JOIN LATERAL (SELECT our.role_id, r.name AS role_name, r.code AS role_code FROM org_user_roles our JOIN org_roles r ON r.id = our.role_id WHERE our.account_id = oa.id ORDER BY our.role_id ASC LIMIT 1) r ON true").
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
		Select("e.*, b.name as branch_name, d.name as department_name, p.name as position_title, r.role_id, r.role_name, r.role_code").
		Joins("LEFT JOIN branches b ON b.id = e.branch_id").
		Joins("LEFT JOIN departments d ON d.id = e.department_id").
		Joins("LEFT JOIN positions p ON p.id = e.position_id").
		Joins("LEFT JOIN LATERAL (SELECT id FROM organization_accounts WHERE employee_id = e.id AND organization_id = e.organization_id ORDER BY (status = 'ACTIVE') DESC, created_at DESC LIMIT 1) oa ON true").
		Joins("LEFT JOIN LATERAL (SELECT our.role_id, r.name AS role_name, r.code AS role_code FROM org_user_roles our JOIN org_roles r ON r.id = our.role_id WHERE our.account_id = oa.id ORDER BY our.role_id ASC LIMIT 1) r ON true").
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

func (r *repository) Update(ctx context.Context, emp *models.Employee, profile *models.EmployeeProfile, roleID *string, fallbackPassHash string) error {
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
		if roleID != nil && *roleID != "" {
			var account models.OrganizationAccount
			err := tx.Where("employee_id = ? AND organization_id = ?", emp.ID, emp.OrganizationID).
				Order("created_at DESC").
				First(&account).Error
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					ident := strings.TrimSpace(emp.EmployeeCode)
					if ident == "" {
						ident = emp.ID
					}
					account = models.OrganizationAccount{
						OrganizationID:     emp.OrganizationID,
						EmployeeID:         emp.ID,
						Identifier:         ident,
						PasswordHash:       fallbackPassHash,
						Status:             "ACTIVE",
						MustChangePassword: true,
					}
					if err := tx.Create(&account).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			}
			var existingRoleID string
			_ = tx.Table("org_user_roles").
				Select("role_id").
				Where("account_id = ?", account.ID).
				Order("role_id ASC").
				Limit(1).
				Scan(&existingRoleID).Error
			if existingRoleID != *roleID {
				if existingRoleID != "" {
					if err := tx.Exec("DELETE FROM org_user_roles WHERE account_id = ? AND role_id = ?", account.ID, existingRoleID).Error; err != nil {
						return err
					}
				}
				if err := tx.Exec("INSERT INTO org_user_roles (account_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING", account.ID, *roleID).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *repository) SoftDelete(ctx context.Context, orgID, id string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Employee{}).
			Where("id = ? AND organization_id = ? AND deleted_at IS NULL", id, orgID).
			Updates(map[string]any{
				"deleted_at":        now,
				"employment_status": "TERMINATED",
				"updated_at":        now,
			}).Error; err != nil {
			return err
		}

		var accountIDs []string
		if err := tx.Table("organization_accounts").
			Where("organization_id = ? AND employee_id = ?", orgID, id).
			Pluck("id", &accountIDs).Error; err != nil {
			return err
		}
		if len(accountIDs) > 0 {
			if err := tx.Model(&models.OrganizationAccount{}).
				Where("organization_id = ? AND id IN ?", orgID, accountIDs).
				Updates(map[string]any{
					"status":     "INACTIVE",
					"updated_at": now,
				}).Error; err != nil {
				return err
			}
			if err := tx.Exec(
				"UPDATE workspace_sessions SET revoked_at = ?, revoked_reason = ? WHERE organization_id = ? AND account_id IN ? AND revoked_at IS NULL",
				now, "Employee deleted or terminated", orgID, accountIDs,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *repository) ValidateBranch(ctx context.Context, orgID, branchID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("branches").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE'", branchID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ValidateDepartment(ctx context.Context, orgID, departmentID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("departments").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE'", departmentID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ValidatePosition(ctx context.Context, orgID, positionID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("positions").
		Where("id = ? AND organization_id = ? AND status = 'ACTIVE'", positionID, orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ValidateRole(ctx context.Context, orgID, roleID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("org_roles").
		Where("id = ? AND (organization_id = ? OR organization_id IS NULL)", roleID, orgID).
		Count(&count).Error
	return count > 0, err
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
