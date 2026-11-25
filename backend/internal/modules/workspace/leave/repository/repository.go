package repository

import (
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"hrgo/backend/internal/modules/workspace/leave/models"
	"hrgo/backend/internal/modules/workspace/leave/request"
)

type Repository interface {
	ValidateEmployee(ctx context.Context, orgID, employeeID string) (bool, error)
	ListLeaveTypes(ctx context.Context, orgID string, activeOnly bool) ([]models.LeaveType, error)
	FindLeaveTypeByID(ctx context.Context, orgID, id string) (*models.LeaveType, error)
	FindLeaveRuleByType(ctx context.Context, leaveTypeID string) (*models.LeaveRule, error)
	CreateLeaveTypeWithRule(ctx context.Context, lt *models.LeaveType, rule *models.LeaveRule) error
	UpdateLeaveType(ctx context.Context, lt *models.LeaveType) error

	EnsureEmployeeBalancesForYear(ctx context.Context, orgID, employeeID string, year int) error
	ListBalances(ctx context.Context, orgID string, q request.ListLeaveBalancesQuery) ([]models.LeaveBalance, error)
	FindBalance(ctx context.Context, orgID, employeeID, leaveTypeID string, year int) (*models.LeaveBalance, error)
	ApplyBalanceAdjustment(ctx context.Context, orgID, employeeID, leaveTypeID string, year int, days float64, reason string, actorID *string) (*models.LeaveBalance, error)

	ListRequests(ctx context.Context, orgID string, q request.ListLeaveRequestsQuery) ([]models.LeaveRequest, int64, error)
	FindRequestByID(ctx context.Context, orgID, id string) (*models.LeaveRequest, error)
	CreateRequestWithReserve(ctx context.Context, req *models.LeaveRequest, reserveBalanceID *string) error
	ReviewRequestTx(ctx context.Context, orgID string, lr *models.LeaveRequest, approval *models.LeaveApproval, balanceYear int, requiresBalance bool) error
	CancelRequestTx(ctx context.Context, orgID string, lr *models.LeaveRequest, balanceYear int, requiresBalance bool) error
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

func (r *repo) ListLeaveTypes(ctx context.Context, orgID string, activeOnly bool) ([]models.LeaveType, error) {
	tx := r.db.WithContext(ctx).Where("organization_id = ? AND deleted_at IS NULL", orgID)
	if activeOnly {
		tx = tx.Where("status = 'ACTIVE'")
	}
	var items []models.LeaveType
	err := tx.Order("name ASC").Find(&items).Error
	return items, err
}

func (r *repo) FindLeaveTypeByID(ctx context.Context, orgID, id string) (*models.LeaveType, error) {
	var lt models.LeaveType
	err := r.db.WithContext(ctx).
		Where("id = ? AND organization_id = ? AND deleted_at IS NULL", id, orgID).
		Take(&lt).Error
	if err != nil {
		return nil, err
	}
	return &lt, nil
}

func (r *repo) FindLeaveRuleByType(ctx context.Context, leaveTypeID string) (*models.LeaveRule, error) {
	var rule models.LeaveRule
	err := r.db.WithContext(ctx).Where("leave_type_id = ?", leaveTypeID).Take(&rule).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *repo) CreateLeaveTypeWithRule(ctx context.Context, lt *models.LeaveType, rule *models.LeaveRule) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(lt).Error; err != nil {
			return err
		}
		rule.OrganizationID = lt.OrganizationID
		rule.LeaveTypeID = lt.ID
		return tx.Create(rule).Error
	})
}

func (r *repo) UpdateLeaveType(ctx context.Context, lt *models.LeaveType) error {
	return r.db.WithContext(ctx).Save(lt).Error
}

func (r *repo) EnsureEmployeeBalancesForYear(ctx context.Context, orgID, employeeID string, year int) error {
	var types []models.LeaveType
	if err := r.db.WithContext(ctx).
		Where("organization_id = ? AND deleted_at IS NULL AND status = 'ACTIVE'", orgID).
		Find(&types).Error; err != nil {
		return err
	}
	if len(types) == 0 {
		return nil
	}
	now := time.Now().UTC()
	for _, t := range types {
		b := models.LeaveBalance{
			OrganizationID: orgID,
			EmployeeID:     employeeID,
			LeaveTypeID:    t.ID,
			BalanceYear:    year,
			AllocatedDays:  t.AnnualAllowance,
			UsedDays:       0,
			PendingDays:    0,
			RemainingDays:  t.AnnualAllowance,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "employee_id"}, {Name: "leave_type_id"}, {Name: "balance_year"}},
			DoNothing: true,
		}).Create(&b).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *repo) ListBalances(ctx context.Context, orgID string, q request.ListLeaveBalancesQuery) ([]models.LeaveBalance, error) {
	tx := r.db.WithContext(ctx).
		Table("leave_balances lb").
		Select(`lb.*,
			lt.name AS leave_type_name,
			lt.code AS leave_type_code,
			lt.requires_balance,
			e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name`).
		Joins("JOIN leave_types lt ON lt.id = lb.leave_type_id").
		Joins("JOIN employee_identities e ON e.id = lb.employee_id").
		Where("lb.organization_id = ? AND lt.deleted_at IS NULL", orgID)

	if q.EmployeeID != "" {
		tx = tx.Where("lb.employee_id = ?", q.EmployeeID)
	}
	if q.Year > 0 {
		tx = tx.Where("lb.balance_year = ?", q.Year)
	}

	var items []models.LeaveBalance
	err := tx.Order("lt.name ASC").Scan(&items).Error
	return items, err
}

func (r *repo) FindBalance(ctx context.Context, orgID, employeeID, leaveTypeID string, year int) (*models.LeaveBalance, error) {
	var lb models.LeaveBalance
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND employee_id = ? AND leave_type_id = ? AND balance_year = ?", orgID, employeeID, leaveTypeID, year).
		Take(&lb).Error
	if err != nil {
		return nil, err
	}
	return &lb, nil
}

func (r *repo) ApplyBalanceAdjustment(ctx context.Context, orgID, employeeID, leaveTypeID string, year int, days float64, reason string, actorID *string) (*models.LeaveBalance, error) {
	if err := r.EnsureEmployeeBalancesForYear(ctx, orgID, employeeID, year); err != nil {
		return nil, err
	}
	var updated models.LeaveBalance
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("organization_id = ? AND employee_id = ? AND leave_type_id = ? AND balance_year = ?", orgID, employeeID, leaveTypeID, year).
			Take(&updated).Error; err != nil {
			return err
		}
		now := time.Now().UTC()
		updated.AllocatedDays += days
		updated.RemainingDays = updated.AllocatedDays - updated.UsedDays - updated.PendingDays
		updated.UpdatedAt = now
		if err := tx.Save(&updated).Error; err != nil {
			return err
		}
		adj := models.LeaveAdjustment{
			OrganizationID:      orgID,
			LeaveBalanceID:      updated.ID,
			EmployeeID:          employeeID,
			LeaveTypeID:         leaveTypeID,
			AdjustmentDays:      days,
			Reason:              reason,
			AdjustedByAccountID: actorID,
			CreatedAt:           now,
		}
		return tx.Create(&adj).Error
	})
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *repo) ListRequests(ctx context.Context, orgID string, q request.ListLeaveRequestsQuery) ([]models.LeaveRequest, int64, error) {
	tx := r.db.WithContext(ctx).
		Table("leave_requests lr").
		Select(`lr.*,
			e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			lt.name AS leave_type_name,
			lt.code AS leave_type_code,
			la.remarks AS decision_notes`).
		Joins("JOIN employee_identities e ON e.id = lr.employee_id").
		Joins("JOIN leave_types lt ON lt.id = lr.leave_type_id").
		Joins("LEFT JOIN LATERAL (SELECT remarks FROM leave_approvals WHERE leave_request_id = lr.id ORDER BY decided_at DESC LIMIT 1) la ON TRUE").
		Where("lr.organization_id = ?", orgID)

	if q.Status != "" {
		tx = tx.Where("lr.request_status = ?", q.Status)
	}
	if q.EmployeeID != "" {
		tx = tx.Where("lr.employee_id = ?", q.EmployeeID)
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

	var items []models.LeaveRequest
	err := tx.Order("lr.created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Scan(&items).Error
	return items, total, err
}

func (r *repo) FindRequestByID(ctx context.Context, orgID, id string) (*models.LeaveRequest, error) {
	var lr models.LeaveRequest
	err := r.db.WithContext(ctx).
		Table("leave_requests lr").
		Select(`lr.*,
			e.employee_code,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			lt.name AS leave_type_name,
			lt.code AS leave_type_code`).
		Joins("JOIN employee_identities e ON e.id = lr.employee_id").
		Joins("JOIN leave_types lt ON lt.id = lr.leave_type_id").
		Where("lr.id = ? AND lr.organization_id = ?", id, orgID).
		Take(&lr).Error
	if err != nil {
		return nil, err
	}
	return &lr, nil
}

func (r *repo) CreateRequestWithReserve(ctx context.Context, req *models.LeaveRequest, reserveBalanceID *string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if reserveBalanceID != nil {
			var bal models.LeaveBalance
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("id = ?", *reserveBalanceID).
				Take(&bal).Error; err != nil {
				return err
			}
			bal.PendingDays += req.RequestedDays
			bal.RemainingDays = bal.AllocatedDays - bal.UsedDays - bal.PendingDays
			bal.UpdatedAt = time.Now().UTC()
			if err := tx.Save(&bal).Error; err != nil {
				return err
			}
		}
		return tx.Create(req).Error
	})
}

func (r *repo) ReviewRequestTx(ctx context.Context, orgID string, lr *models.LeaveRequest, approval *models.LeaveApproval, balanceYear int, requiresBalance bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		if err := tx.Table("leave_requests").
			Where("id = ? AND organization_id = ?", lr.ID, orgID).
			Updates(map[string]any{
				"request_status": lr.RequestStatus,
				"updated_at":     now,
			}).Error; err != nil {
			return err
		}

		if err := tx.Create(approval).Error; err != nil {
			return err
		}

		if requiresBalance {
			var bal models.LeaveBalance
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("organization_id = ? AND employee_id = ? AND leave_type_id = ? AND balance_year = ?", orgID, lr.EmployeeID, lr.LeaveTypeID, balanceYear).
				Take(&bal).Error; err == nil {
				bal.PendingDays -= lr.RequestedDays
				if bal.PendingDays < 0 {
					bal.PendingDays = 0
				}
				if lr.RequestStatus == "APPROVED" {
					bal.UsedDays += lr.RequestedDays
				}
				bal.RemainingDays = bal.AllocatedDays - bal.UsedDays - bal.PendingDays
				bal.UpdatedAt = now
				if err := tx.Save(&bal).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *repo) CancelRequestTx(ctx context.Context, orgID string, lr *models.LeaveRequest, balanceYear int, requiresBalance bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		if err := tx.Table("leave_requests").
			Where("id = ? AND organization_id = ?", lr.ID, orgID).
			Updates(map[string]any{
				"request_status": "CANCELLED",
				"updated_at":     now,
			}).Error; err != nil {
			return err
		}

		if requiresBalance {
			var bal models.LeaveBalance
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("organization_id = ? AND employee_id = ? AND leave_type_id = ? AND balance_year = ?", orgID, lr.EmployeeID, lr.LeaveTypeID, balanceYear).
				Take(&bal).Error; err == nil {
				bal.PendingDays -= lr.RequestedDays
				if bal.PendingDays < 0 {
					bal.PendingDays = 0
				}
				bal.RemainingDays = bal.AllocatedDays - bal.UsedDays - bal.PendingDays
				bal.UpdatedAt = now
				if err := tx.Save(&bal).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
