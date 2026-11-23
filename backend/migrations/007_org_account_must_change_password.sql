-- 007_org_account_must_change_password.sql
-- Fixes BUG-07: Require forced password change on first login for organization accounts.

ALTER TABLE organization_accounts
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing accounts that have already logged in do not need to be forced to change password
UPDATE organization_accounts
SET must_change_password = FALSE
WHERE last_login_at IS NOT NULL;
