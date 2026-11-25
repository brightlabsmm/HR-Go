-- 013_phase2_leave_and_overtime.sql
-- Phase 2 Leave & Overtime Management Schema (ERD-aligned)

-- 1. Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    requires_balance BOOLEAN NOT NULL DEFAULT TRUE,
    annual_allowance NUMERIC(6, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_leave_types_org_code UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_leave_types_org ON leave_types (organization_id, status) WHERE deleted_at IS NULL;

-- 2. Leave Rules
CREATE TABLE IF NOT EXISTS leave_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types (id) ON DELETE CASCADE,
    min_notice_days INT NOT NULL DEFAULT 0,
    max_consecutive_days INT,
    allow_half_day BOOLEAN NOT NULL DEFAULT TRUE,
    carry_over_limit NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leave_rule_type UNIQUE (leave_type_id)
);

-- 3. Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types (id) ON DELETE CASCADE,
    balance_year INT NOT NULL,
    allocated_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    used_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    pending_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    remaining_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leave_balance_emp_type_yr UNIQUE (employee_id, leave_type_id, balance_year)
);
CREATE INDEX IF NOT EXISTS idx_leave_balances_emp ON leave_balances (organization_id, employee_id, balance_year);

-- 4. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types (id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    requested_days NUMERIC(6, 2) NOT NULL,
    reason TEXT NOT NULL,
    request_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_leave_request_status CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_leave_requests_org_status ON leave_requests (organization_id, request_status, employee_id);

-- 5. Leave Approvals
CREATE TABLE IF NOT EXISTS leave_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    leave_request_id UUID NOT NULL REFERENCES leave_requests (id) ON DELETE CASCADE,
    approver_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    decision VARCHAR(30) NOT NULL,
    remarks TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leave_approvals_req ON leave_approvals (leave_request_id);

-- 6. Leave Adjustments
CREATE TABLE IF NOT EXISTS leave_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    leave_balance_id UUID NOT NULL REFERENCES leave_balances (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types (id) ON DELETE CASCADE,
    adjustment_days NUMERIC(6, 2) NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leave_adjustments_emp ON leave_adjustments (organization_id, employee_id);

-- 7. Overtime Categories
CREATE TABLE IF NOT EXISTS overtime_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rate_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_overtime_categories_org_code UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_overtime_categories_org ON overtime_categories (organization_id, status) WHERE deleted_at IS NULL;

-- 8. Overtime Rules
CREATE TABLE IF NOT EXISTS overtime_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    overtime_category_id UUID NOT NULL REFERENCES overtime_categories (id) ON DELETE CASCADE,
    min_minutes INT NOT NULL DEFAULT 30,
    max_daily_minutes INT NOT NULL DEFAULT 480,
    requires_pre_approval BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_overtime_rule_cat UNIQUE (overtime_category_id)
);

-- 9. Overtime Requests
CREATE TABLE IF NOT EXISTS overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    overtime_category_id UUID NOT NULL REFERENCES overtime_categories (id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    requested_minutes INT NOT NULL,
    reason TEXT NOT NULL,
    request_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_overtime_request_status CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_org_status ON overtime_requests (organization_id, request_status, employee_id);

-- 10. Overtime Approvals
CREATE TABLE IF NOT EXISTS overtime_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    overtime_request_id UUID NOT NULL REFERENCES overtime_requests (id) ON DELETE CASCADE,
    approver_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    decision VARCHAR(30) NOT NULL,
    remarks TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_overtime_approvals_req ON overtime_approvals (overtime_request_id);

-- 11. Overtime Entries (Generated upon approval)
CREATE TABLE IF NOT EXISTS overtime_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    overtime_request_id UUID NOT NULL REFERENCES overtime_requests (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    overtime_category_id UUID NOT NULL REFERENCES overtime_categories (id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    approved_minutes INT NOT NULL,
    multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_overtime_entry_req UNIQUE (overtime_request_id)
);
CREATE INDEX IF NOT EXISTS idx_overtime_entries_emp ON overtime_entries (organization_id, employee_id, work_date DESC);

-- 12. Permissions for Leave & Overtime
INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES
    ('org.leave.read', 'ORG', 'leave', 'leave', 'read', 'View leave types, balances, and requests'),
    ('org.leave.create', 'ORG', 'leave', 'leave', 'create', 'Submit leave requests'),
    ('org.leave.approve', 'ORG', 'leave', 'leave', 'approve', 'Approve or reject leave requests'),
    ('org.leave.manage', 'ORG', 'leave', 'leave', 'manage', 'Configure leave types, rules, and balance adjustments'),
    ('org.overtime.read', 'ORG', 'overtime', 'overtime', 'read', 'View overtime categories, requests, and entries'),
    ('org.overtime.create', 'ORG', 'overtime', 'overtime', 'create', 'Submit overtime requests'),
    ('org.overtime.approve', 'ORG', 'overtime', 'overtime', 'approve', 'Approve or reject overtime requests'),
    ('org.overtime.manage', 'ORG', 'overtime', 'overtime', 'manage', 'Configure overtime categories and rules')
ON CONFLICT (code) DO NOTHING;

INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.leave.read', 'org.leave.create', 'org.leave.approve', 'org.leave.manage',
    'org.overtime.read', 'org.overtime.create', 'org.overtime.approve', 'org.overtime.manage'
)
WHERE r.code IN ('ORG_ADMIN', 'HR_MANAGER') AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.leave.read', 'org.leave.create', 'org.leave.approve',
    'org.overtime.read', 'org.overtime.create', 'org.overtime.approve'
)
WHERE r.code = 'BRANCH_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.leave.read', 'org.leave.create',
    'org.overtime.read', 'org.overtime.create'
)
WHERE r.code = 'EMPLOYEE' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;
