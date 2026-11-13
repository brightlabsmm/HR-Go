package main

import (
	"context"
	"database/sql"
	"log"
	"time"

	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/shared/security"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db error: %v", err)
	}

	// 1. Ensure Superadmin
	adminPassHash, _ := security.HashPassword("Admin@12345")
	var superadminRoleID string
	_ = db.Table("platform_roles").Where("code = ?", "SUPERADMIN").Select("id").Scan(&superadminRoleID)

	var adminUserID string
	err = db.Raw(`
		INSERT INTO platform_users (email, full_name, password_hash, status)
		VALUES ('admin@example.com', 'Platform Superadmin', ?, 'ACTIVE')
		ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
		RETURNING id
	`, adminPassHash).Scan(&adminUserID).Error
	if err != nil {
		log.Fatalf("create superadmin error: %v", err)
	}

	_ = db.Exec(`
		INSERT INTO platform_user_roles (platform_user_id, role_id)
		VALUES (?, ?)
		ON CONFLICT DO NOTHING
	`, adminUserID, superadminRoleID)

	// 2. Ensure Demo Customer Organization
	var orgID string
	err = db.Raw(`SELECT id FROM organizations WHERE LOWER(code) = LOWER('ORG-001')`).Scan(&orgID).Error
	if err != nil || orgID == "" {
		err = db.Raw(`
			INSERT INTO organizations (code, legal_name, display_name, status, country)
			VALUES ('ORG-001', 'Acme Corporation Limited', 'Acme Corp', 'ACTIVE', 'MM')
			RETURNING id
		`).Scan(&orgID).Error
		if err != nil {
			log.Fatalf("create org error: %v", err)
		}
	}

	// 3. Ensure Employee Identity
	var empID string
	err = db.Raw(`SELECT id FROM employee_identities WHERE organization_id = ? AND employee_code = 'EMP-001'`, orgID).Scan(&empID).Error
	if err != nil || empID == "" {
		err = db.Raw(`
			INSERT INTO employee_identities (organization_id, employee_code, first_name, last_name, email)
			VALUES (?, 'EMP-001', 'Aung', 'Kyaw', 'aungkyaw@example.com')
			RETURNING id
		`, orgID).Scan(&empID).Error
		if err != nil {
			log.Fatalf("create employee error: %v", err)
		}
	}

	// 4. Ensure Organization Account for Employee (EMP-001 / Password@123)
	empPassHash, _ := security.HashPassword("Password@123")
	var accountID string
	err = db.Raw(`SELECT id FROM organization_accounts WHERE organization_id = ? AND identifier = 'EMP-001'`, orgID).Scan(&accountID).Error
	if err != nil || accountID == "" {
		err = db.Raw(`
			INSERT INTO organization_accounts (organization_id, employee_id, identifier, password_hash, status)
			VALUES (?, ?, 'EMP-001', ?, 'ACTIVE')
			RETURNING id
		`, orgID, empID, empPassHash).Scan(&accountID).Error
		if err != nil {
			log.Fatalf("create org account error: %v", err)
		}
	} else {
		_ = db.Exec(`UPDATE organization_accounts SET password_hash = ? WHERE id = ?`, empPassHash, accountID)
	}

	// 5. Assign ORG_ADMIN role to EMP-001
	var orgAdminRoleID sql.NullString
	_ = db.Raw(`SELECT id FROM org_roles WHERE code = 'ORG_ADMIN' AND organization_id IS NULL LIMIT 1`).Scan(&orgAdminRoleID)
	if orgAdminRoleID.Valid {
		_ = db.Exec(`
			INSERT INTO org_user_roles (account_id, role_id)
			VALUES (?, ?)
			ON CONFLICT DO NOTHING
		`, accountID, orgAdminRoleID.String)
	}

	log.Println("Seed completed successfully:")
	log.Println(" - Platform Admin Login: admin@example.com / Admin@12345")
	log.Println(" - Workspace Employee Login: EMP-001 / Password@123 (Org: ORG-001)")
}
