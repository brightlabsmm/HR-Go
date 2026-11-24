-- Migration: 010_org_settings_permissions.sql
-- Fixes BUG-32: Add workspace permissions for organization settings and seed default permissions.

INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES
    ('org.settings.read', 'ORG', 'organization', 'organization_settings', 'read', 'View organization profile and settings'),
    ('org.settings.update', 'ORG', 'organization', 'organization_settings', 'update', 'Update organization profile and settings')
ON CONFLICT (code) DO NOTHING;

-- Grant org.settings.read and org.settings.update to ORG_ADMIN
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_ADMIN' AND r.organization_id IS NULL AND p.code IN ('org.settings.read', 'org.settings.update')
ON CONFLICT DO NOTHING;

-- Grant org.settings.read to HR_MANAGER
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
CROSS JOIN permissions p
WHERE r.code = 'HR_MANAGER' AND r.organization_id IS NULL AND p.code = 'org.settings.read'
ON CONFLICT DO NOTHING;
