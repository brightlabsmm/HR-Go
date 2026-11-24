-- Migration: 009_organization_suspension_schedule_and_sessions.sql
-- 1. Add suspension schedule, reason, and session revocation tracking to organizations
-- 2. Create workspace_sessions table for granular session management and revocation

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspend_notify_from TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspend_notify_to TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS scheduled_suspend_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspend_reason VARCHAR(500);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_scheduled_suspend
    ON organizations (scheduled_suspend_at)
    WHERE deleted_at IS NULL AND scheduled_suspend_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS workspace_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES organization_accounts(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_workspace_sessions_org_revoked
    ON workspace_sessions (organization_id, revoked_at);

CREATE INDEX IF NOT EXISTS idx_workspace_sessions_account_revoked
    ON workspace_sessions (account_id, revoked_at);

CREATE INDEX IF NOT EXISTS idx_workspace_sessions_expires_at
    ON workspace_sessions (expires_at);
