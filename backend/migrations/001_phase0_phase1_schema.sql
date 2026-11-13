-- Phase 0 & Phase 1 Complete Schema Migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    country VARCHAR(10) NOT NULL DEFAULT 'MM',
    address TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_org_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_code_lower ON organizations (LOWER(code));
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations (status);

-- 2. Countries (System lookup)
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    default_timezone VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES branches (id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branches_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_branch_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_branches_org ON branches (organization_id, status);

-- 4. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches (id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_depts_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_dept_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_depts_org ON departments (organization_id, status);

-- 5. Positions
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments (id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_positions_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_position_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_positions_org ON positions (organization_id, status);

-- 6. Platform Permissions & Platform Roles
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    scope VARCHAR(20) NOT NULL DEFAULT 'PLATFORM', -- 'PLATFORM' or 'ORG'
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_role_permissions (
    role_id UUID NOT NULL REFERENCES platform_roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plt_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE TABLE IF NOT EXISTS platform_user_roles (
    platform_user_id UUID NOT NULL REFERENCES platform_users (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform_roles (id) ON DELETE CASCADE,
    PRIMARY KEY (platform_user_id, role_id)
);

-- 7. Organization Roles & Workspace RBAC
CREATE TABLE IF NOT EXISTS org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations (id) ON DELETE CASCADE, -- NULL for system-default org roles
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_roles_system ON org_roles (code) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_roles_org ON org_roles (organization_id, code) WHERE organization_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS org_role_permissions (
    role_id UUID NOT NULL REFERENCES org_roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 8. Employee Identities & Organization Accounts
CREATE TABLE IF NOT EXISTS employee_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    branch_id UUID REFERENCES branches (id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments (id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_org_code UNIQUE (organization_id, employee_code)
);

CREATE TABLE IF NOT EXISTS organization_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    identifier VARCHAR(100) NOT NULL, -- e.g. EMP-001 or login ID
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_account_ident UNIQUE (organization_id, identifier),
    CONSTRAINT chk_org_acc_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE TABLE IF NOT EXISTS org_user_roles (
    account_id UUID NOT NULL REFERENCES organization_accounts (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES org_roles (id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches (id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments (id) ON DELETE CASCADE,
    PRIMARY KEY (account_id, role_id)
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations (id) ON DELETE SET NULL,
    actor_id UUID,
    actor_type VARCHAR(50) NOT NULL, -- 'PLATFORM' or 'WORKSPACE'
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    client_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs (organization_id, created_at DESC);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Countries
INSERT INTO countries (iso_code, name, phone_code, currency_code, default_timezone)
VALUES
    ('MM', 'Myanmar', '+95', 'MMK', 'Asia/Yangon'),
    ('TH', 'Thailand', '+66', 'THB', 'Asia/Bangkok'),
    ('SG', 'Singapore', '+65', 'SGD', 'Asia/Singapore')
ON CONFLICT (iso_code) DO NOTHING;

-- Platform & Org Permissions
INSERT INTO permissions (code, scope, resource, action, description)
VALUES
    -- Platform permissions
    ('platform.user.read', 'PLATFORM', 'platform_user', 'read', 'View platform users'),
    ('platform.user.create', 'PLATFORM', 'platform_user', 'create', 'Create platform users'),
    ('platform.user.update', 'PLATFORM', 'platform_user', 'update', 'Update platform users'),
    ('platform.user.deactivate', 'PLATFORM', 'platform_user', 'deactivate', 'Deactivate platform users'),
    ('platform.role.read', 'PLATFORM', 'platform_role', 'read', 'View platform roles and permissions'),
    ('platform.role.assign', 'PLATFORM', 'platform_role', 'assign', 'Assign platform roles to users'),
    ('platform.permission.read', 'PLATFORM', 'permission', 'read', 'View permission catalogue'),
    ('platform.organization.create', 'PLATFORM', 'organization', 'create', 'Create customer organizations'),
    ('platform.organization.read', 'PLATFORM', 'organization', 'read', 'View and search customer organizations'),
    ('platform.organization.update', 'PLATFORM', 'organization', 'update', 'Update organization profiles'),
    ('platform.organization.status.update', 'PLATFORM', 'organization', 'status.update', 'Execute organization lifecycle status changes'),

    -- Org permissions
    ('org.branch.create', 'ORG', 'branch', 'create', 'Create branches'),
    ('org.branch.read', 'ORG', 'branch', 'read', 'View and list branches'),
    ('org.branch.update', 'ORG', 'branch', 'update', 'Update branches'),
    ('org.branch.deactivate', 'ORG', 'branch', 'deactivate', 'Deactivate branches'),
    ('org.department.create', 'ORG', 'department', 'create', 'Create departments'),
    ('org.department.read', 'ORG', 'department', 'read', 'View and list departments'),
    ('org.department.update', 'ORG', 'department', 'update', 'Update departments'),
    ('org.department.deactivate', 'ORG', 'department', 'deactivate', 'Deactivate departments'),
    ('org.position.create', 'ORG', 'position', 'create', 'Create positions'),
    ('org.position.read', 'ORG', 'position', 'read', 'View and list positions'),
    ('org.position.update', 'ORG', 'position', 'update', 'Update positions'),
    ('org.position.deactivate', 'ORG', 'position', 'deactivate', 'Deactivate positions'),
    ('org.role.read', 'ORG', 'org_role', 'read', 'View organization roles'),
    ('org.role.assign', 'ORG', 'org_role', 'assign', 'Assign organization roles to accounts')
ON CONFLICT (code) DO NOTHING;

-- Platform Roles
INSERT INTO platform_roles (code, name, description)
VALUES
    ('SUPERADMIN', 'Superadmin', 'Full platform administrative access'),
    ('PLATFORM_SUPPORT', 'Platform Support', 'Platform operational support and read access')
ON CONFLICT (code) DO NOTHING;

-- Attach all PLATFORM permissions to SUPERADMIN
INSERT INTO platform_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPERADMIN' AND p.scope = 'PLATFORM'
ON CONFLICT DO NOTHING;

-- Attach read permissions to PLATFORM_SUPPORT
INSERT INTO platform_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM platform_roles r
JOIN permissions p ON p.action IN ('read') AND p.scope = 'PLATFORM'
WHERE r.code = 'PLATFORM_SUPPORT'
ON CONFLICT DO NOTHING;

-- System-default Org Roles
INSERT INTO org_roles (code, name, description, is_system)
VALUES
    ('ORG_ADMIN', 'Org Admin', 'Full organization administrative control', TRUE),
    ('ORG_SUPPORT', 'Org Support', 'Organization support role', TRUE),
    ('BRANCH_MANAGER', 'Branch Manager', 'Manager for branch operations', TRUE),
    ('HR_MANAGER', 'HR Manager', 'Workforce and organization structure management', TRUE),
    ('HR_SUPPORT', 'HR Support', 'Human resources support operations', TRUE),
    ('DEPARTMENT_MANAGER', 'Department Manager', 'Department-level supervisory access', TRUE),
    ('EMPLOYEE', 'Employee', 'Base employee access', TRUE)
ON CONFLICT DO NOTHING;

-- Attach all ORG permissions to ORG_ADMIN
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_ADMIN' AND r.organization_id IS NULL AND p.scope = 'ORG'
ON CONFLICT DO NOTHING;
