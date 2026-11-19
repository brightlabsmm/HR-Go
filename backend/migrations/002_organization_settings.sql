-- Add organization_settings table and backfill default code formats for existing organizations

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_organization_settings_org_key UNIQUE (organization_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_organization_settings_org ON organization_settings (organization_id);

-- Backfill default branch_code_format and department_code_format for existing organizations
INSERT INTO organization_settings (organization_id, setting_key, setting_value)
SELECT id, 'branch_code_format', 'BR-{0000}'
FROM organizations
ON CONFLICT (organization_id, setting_key) DO NOTHING;

INSERT INTO organization_settings (organization_id, setting_key, setting_value)
SELECT id, 'department_code_format', 'DEPT-{0000}'
FROM organizations
ON CONFLICT (organization_id, setting_key) DO NOTHING;
