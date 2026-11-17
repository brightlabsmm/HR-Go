-- Migration: 003_permission_grouping.sql
-- Add grouping column to permissions table to organize permissions by grouping (e.g. branch, department, user, etc.)

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS grouping VARCHAR(50) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_permissions_grouping ON permissions (grouping, scope);

-- Backfill grouping column for Platform permissions
UPDATE permissions SET grouping = 'user' WHERE resource = 'platform_user' OR code LIKE 'platform.user.%';
UPDATE permissions SET grouping = 'role' WHERE resource IN ('platform_role', 'permission') OR code LIKE 'platform.role.%' OR code LIKE 'platform.permission.%';
UPDATE permissions SET grouping = 'organization' WHERE resource = 'organization' OR code LIKE 'platform.organization.%';

-- Backfill grouping column for Org permissions
UPDATE permissions SET grouping = 'branch' WHERE resource = 'branch' OR code LIKE 'org.branch.%';
UPDATE permissions SET grouping = 'department' WHERE resource = 'department' OR code LIKE 'org.department.%';
UPDATE permissions SET grouping = 'position' WHERE resource = 'position' OR code LIKE 'org.position.%';
UPDATE permissions SET grouping = 'role' WHERE resource = 'org_role' OR code LIKE 'org.role.%';
