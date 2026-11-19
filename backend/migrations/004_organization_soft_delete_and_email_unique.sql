-- Migration: 004_organization_soft_delete_and_email_unique.sql
-- 1. Add deleted_at column to organizations for soft delete
-- 2. Remove ARCHIVED status from organizations lifecycle
-- 3. Scope organization code & contact_email uniqueness to non-deleted organizations
-- 4. Add platform.organization.delete permission and assign to SUPERADMIN

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Convert any legacy ARCHIVED organizations to soft-deleted SUSPENDED rows before tightening CHECK constraint
UPDATE organizations
SET status = 'SUSPENDED',
    deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'ARCHIVED';

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_org_status;
ALTER TABLE organizations ADD CONSTRAINT chk_org_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED'));

-- Replace code unique index with partial unique index excluding soft-deleted organizations
DROP INDEX IF EXISTS idx_organizations_code_lower;
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_code_lower
    ON organizations (LOWER(code))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at
    ON organizations (deleted_at);

-- Create partial unique index on contact_email for non-deleted organizations if no legacy duplicates exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM organizations
        WHERE deleted_at IS NULL
          AND contact_email IS NOT NULL
          AND TRIM(contact_email) <> ''
        GROUP BY LOWER(contact_email)
        HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_contact_email_lower
            ON organizations (LOWER(contact_email))
            WHERE deleted_at IS NULL
              AND contact_email IS NOT NULL
              AND TRIM(contact_email) <> '';
    ELSE
        CREATE INDEX IF NOT EXISTS idx_organizations_contact_email_lower_nonunique
            ON organizations (LOWER(contact_email))
            WHERE deleted_at IS NULL
              AND contact_email IS NOT NULL
              AND TRIM(contact_email) <> '';
    END IF;
END $$;

-- Add platform.organization.delete permission and grant to SUPERADMIN
INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES ('platform.organization.delete', 'PLATFORM', 'organization', 'organization', 'delete', 'Soft delete customer organizations')
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_roles r
JOIN permissions p ON p.code = 'platform.organization.delete'
WHERE r.code = 'SUPERADMIN'
ON CONFLICT DO NOTHING;
