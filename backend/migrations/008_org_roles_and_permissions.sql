-- 008_org_roles_and_permissions.sql
-- Fixes BUG-08: Add workspace user permissions and seed default permissions for standard organization roles.

-- 1. Insert organization user permissions
INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES
    ('org.user.read', 'ORG', 'user', 'organization_account', 'read', 'View organization users and members'),
    ('org.user.create', 'ORG', 'user', 'organization_account', 'create', 'Create organization user accounts'),
    ('org.user.update', 'ORG', 'user', 'organization_account', 'update', 'Update organization user accounts'),
    ('org.user.deactivate', 'ORG', 'user', 'organization_account', 'deactivate', 'Deactivate organization user accounts')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure ORG_ADMIN has all ORG permissions
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_ADMIN' AND r.organization_id IS NULL AND p.scope = 'ORG'
ON CONFLICT DO NOTHING;

-- 3. Seed default permissions for HR_MANAGER
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.branch.read', 'org.branch.create', 'org.branch.update',
    'org.department.read', 'org.department.create', 'org.department.update', 'org.department.deactivate',
    'org.position.read', 'org.position.create', 'org.position.update', 'org.position.deactivate',
    'org.role.read', 'org.role.assign',
    'org.user.read', 'org.user.create', 'org.user.update', 'org.user.deactivate'
)
WHERE r.code = 'HR_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- 4. Seed default permissions for BRANCH_MANAGER
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.branch.read', 'org.branch.update',
    'org.department.read',
    'org.position.read',
    'org.user.read'
)
WHERE r.code = 'BRANCH_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- 5. Seed default permissions for DEPARTMENT_MANAGER
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.branch.read',
    'org.department.read', 'org.department.update',
    'org.position.read',
    'org.user.read'
)
WHERE r.code = 'DEPARTMENT_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- 6. Seed default permissions for HR_SUPPORT & ORG_SUPPORT
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.branch.read',
    'org.department.read',
    'org.position.read',
    'org.role.read',
    'org.user.read'
)
WHERE r.code IN ('HR_SUPPORT', 'ORG_SUPPORT') AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- 7. Seed default permissions for EMPLOYEE
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.branch.read',
    'org.department.read',
    'org.position.read'
)
WHERE r.code = 'EMPLOYEE' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;
