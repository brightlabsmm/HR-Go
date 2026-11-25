-- 012_phase2_erd_completion.sql
-- Phase 2 ERD Completion:
--   branch_operating_hours, employment_contracts, employee_documents,
--   employee_service_years, employee_exit_records, employee_histories,
--   attendance_import_batches, organization_accounts mobile flags,
--   shifts grace_period_minutes/work_days, and audit_logs value diffs.

-- 1. Extend organization_accounts & shifts to match Phase 2 ERD
ALTER TABLE organization_accounts
    ADD COLUMN IF NOT EXISTS mobile_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE shifts
    ADD COLUMN IF NOT EXISTS grace_period_minutes INT NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS work_days JSONB NOT NULL DEFAULT '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]'::jsonb;

-- 2. Extend audit_logs with structured old/new JSONB diffs
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS old_values JSONB,
    ADD COLUMN IF NOT EXISTS new_values JSONB;

CREATE INDEX IF NOT EXISTS idx_audit_org_entity ON audit_logs (organization_id, entity_name, created_at DESC);

-- 3. Branch Operating Hours
CREATE TABLE IF NOT EXISTS branch_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    opening_time VARCHAR(10),
    closing_time VARCHAR(10),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_operating_hours UNIQUE (branch_id, day_of_week),
    CONSTRAINT chk_branch_hours_dow CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'))
);
CREATE INDEX IF NOT EXISTS idx_branch_operating_hours_org ON branch_operating_hours (organization_id, branch_id);

-- 4. Employment Contracts
CREATE TABLE IF NOT EXISTS employment_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contract_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_emp_contracts_emp ON employment_contracts (organization_id, employee_id, start_date DESC) WHERE deleted_at IS NULL;

-- 5. Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_reference TEXT NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_emp_docs_emp ON employee_documents (organization_id, employee_id, created_at DESC) WHERE deleted_at IS NULL;

-- 6. Employee Service Years
CREATE TABLE IF NOT EXISTS employee_service_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    service_years NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_service_year_date UNIQUE (employee_id, calculation_date)
);
CREATE INDEX IF NOT EXISTS idx_emp_service_years_emp ON employee_service_years (organization_id, employee_id, calculation_date DESC);

-- 7. Employee Exit Records
CREATE TABLE IF NOT EXISTS employee_exit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    recorded_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    exit_type VARCHAR(30) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    decision_status VARCHAR(30) NOT NULL DEFAULT 'RECORDED',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emp_exit_records_emp ON employee_exit_records (organization_id, employee_id, effective_date DESC);

-- 8. Employee Histories (Immutable snapshots)
CREATE TABLE IF NOT EXISTS employee_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    exit_record_id UUID REFERENCES employee_exit_records (id) ON DELETE SET NULL,
    employee_snapshot JSONB NOT NULL,
    profile_snapshot JSONB,
    snapshot_reason VARCHAR(50) NOT NULL,
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_emp_histories_emp ON employee_histories (organization_id, employee_id, snapshot_at DESC);

-- 9. Attendance Import Batches
CREATE TABLE IF NOT EXISTS attendance_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    imported_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    file_reference VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    success_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    import_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    error_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_att_import_batches_org ON attendance_import_batches (organization_id, created_at DESC);

-- 10. Permissions for Audit Log viewing
INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES
    ('org.audit.read', 'ORG', 'administration', 'audit_log', 'read', 'View workspace audit trail logs')
ON CONFLICT (code) DO NOTHING;

INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code = 'org.audit.read'
WHERE r.code IN ('ORG_ADMIN', 'HR_MANAGER') AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;
