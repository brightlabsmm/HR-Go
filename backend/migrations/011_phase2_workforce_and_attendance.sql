-- 011_phase2_workforce_and_attendance.sql
-- Phase 2: Workforce & Attendance Schema

-- 1. Extend employee_identities with phone, dates, status, soft-delete
ALTER TABLE employee_identities ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE employee_identities ADD COLUMN IF NOT EXISTS date_of_joining DATE;
ALTER TABLE employee_identities ADD COLUMN IF NOT EXISTS employment_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE employee_identities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_employee_identities_org_status ON employee_identities(organization_id, employment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employee_identities_branch ON employee_identities(organization_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employee_identities_dept ON employee_identities(organization_id, department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employee_identities_pos ON employee_identities(organization_id, position_id) WHERE deleted_at IS NULL;

-- 2. Employee Profile
CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50),
    marital_status VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(255),
    profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_profile_emp UNIQUE (employee_id)
);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_org ON employee_profiles(organization_id);

-- 3. Employee Position History
CREATE TABLE IF NOT EXISTS employee_position_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    old_position_id UUID REFERENCES positions (id) ON DELETE SET NULL,
    new_position_id UUID NOT NULL REFERENCES positions (id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emp_pos_hist_emp ON employee_position_histories(employee_id, effective_date DESC);

-- 4. Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches (id) ON DELETE SET NULL,
    shift_name VARCHAR(100) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    break_minutes INT NOT NULL DEFAULT 60,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_shifts_org_status ON shifts(organization_id, status) WHERE deleted_at IS NULL;

-- 5. Employee Shift Assignments
CREATE TABLE IF NOT EXISTS employee_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts (id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_shift_assign_emp ON employee_shift_assignments(organization_id, employee_id, status) WHERE deleted_at IS NULL;

-- 6. Employee Shift Assignment Histories
CREATE TABLE IF NOT EXISTS employee_shift_assignment_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES employee_shift_assignments (id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    old_shift_id UUID REFERENCES shifts (id) ON DELETE SET NULL,
    new_shift_id UUID REFERENCES shifts (id) ON DELETE SET NULL,
    old_effective_from DATE,
    old_effective_to DATE,
    new_effective_from DATE,
    new_effective_to DATE,
    changed_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_shift_assign_hist_emp ON employee_shift_assignment_histories(employee_id, changed_at DESC);

-- 7. Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches (id) ON DELETE SET NULL,
    holiday_name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    holiday_type VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_holidays_org_date ON holidays(organization_id, start_date, end_date) WHERE deleted_at IS NULL;

-- 8. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts (id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    attendance_status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
    late_minutes INT NOT NULL DEFAULT 0,
    early_leave_minutes INT NOT NULL DEFAULT 0,
    worked_minutes INT NOT NULL DEFAULT 0,
    source VARCHAR(30) NOT NULL DEFAULT 'WEB',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_att_org_emp_date UNIQUE (organization_id, employee_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_records_query ON attendance_records(organization_id, attendance_date, employee_id);

-- 9. Attendance Correction Requests
CREATE TABLE IF NOT EXISTS attendance_correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES attendance_records (id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    requested_check_in TIMESTAMPTZ,
    requested_check_out TIMESTAMPTZ,
    reason TEXT NOT NULL,
    request_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reviewed_by_account_id UUID REFERENCES organization_accounts (id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_att_corr_req_status ON attendance_correction_requests(organization_id, request_status, employee_id);

-- 10. Mobile Devices
CREATE TABLE IF NOT EXISTS mobile_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    organization_account_id UUID NOT NULL REFERENCES organization_accounts (id) ON DELETE CASCADE,
    device_identifier VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mobile_acc_device UNIQUE (organization_account_id, device_identifier)
);

-- 11. Offline Attendance Events & Sync Results
CREATE TABLE IF NOT EXISTS offline_attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee_identities (id) ON DELETE CASCADE,
    local_event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    local_event_time TIMESTAMPTZ NOT NULL,
    sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_offline_event_local UNIQUE (organization_id, employee_id, local_event_id)
);

CREATE TABLE IF NOT EXISTS synchronization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offline_event_id UUID NOT NULL REFERENCES offline_attendance_events (id) ON DELETE CASCADE,
    result_status VARCHAR(30) NOT NULL,
    error_message TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Permissions for Phase 2
INSERT INTO permissions (code, scope, grouping, resource, action, description)
VALUES
    -- Employee
    ('org.employee.read', 'ORG', 'workforce', 'employee', 'read', 'View employee records and profiles'),
    ('org.employee.create', 'ORG', 'workforce', 'employee', 'create', 'Create and onboard employees'),
    ('org.employee.update', 'ORG', 'workforce', 'employee', 'update', 'Update employee profiles and job details'),
    ('org.employee.delete', 'ORG', 'workforce', 'employee', 'delete', 'Deactivate or soft-delete employees'),
    
    -- Shift
    ('org.shift.read', 'ORG', 'attendance', 'shift', 'read', 'View shift configurations and schedules'),
    ('org.shift.create', 'ORG', 'attendance', 'shift', 'create', 'Create shifts'),
    ('org.shift.update', 'ORG', 'attendance', 'shift', 'update', 'Update shifts'),
    ('org.shift.delete', 'ORG', 'attendance', 'shift', 'delete', 'Delete shifts'),
    ('org.shift.assign', 'ORG', 'attendance', 'shift_assignment', 'assign', 'Assign shifts to employees'),

    -- Holiday
    ('org.holiday.read', 'ORG', 'attendance', 'holiday', 'read', 'View holiday calendar'),
    ('org.holiday.create', 'ORG', 'attendance', 'holiday', 'create', 'Create holidays'),
    ('org.holiday.update', 'ORG', 'attendance', 'holiday', 'update', 'Update holidays'),
    ('org.holiday.delete', 'ORG', 'attendance', 'holiday', 'delete', 'Delete holidays'),

    -- Attendance
    ('org.attendance.read', 'ORG', 'attendance', 'attendance_record', 'read', 'View attendance records and reports'),
    ('org.attendance.create', 'ORG', 'attendance', 'attendance_record', 'create', 'Record manual attendance'),
    ('org.attendance.update', 'ORG', 'attendance', 'attendance_record', 'update', 'Update attendance records'),
    ('org.attendance.delete', 'ORG', 'attendance', 'attendance_record', 'delete', 'Delete attendance records'),
    ('org.attendance.correct', 'ORG', 'attendance', 'attendance_correction', 'correct', 'Request attendance corrections'),
    ('org.attendance.approve', 'ORG', 'attendance', 'attendance_correction', 'approve', 'Approve or reject attendance corrections'),

    -- Mobile
    ('org.mobile.access', 'ORG', 'mobile', 'mobile_app', 'access', 'Access employee mobile self-service app')
ON CONFLICT (code) DO NOTHING;

-- Grant all ORG permissions to ORG_ADMIN
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_ADMIN' AND r.organization_id IS NULL AND p.scope = 'ORG'
ON CONFLICT DO NOTHING;

-- Grant HR_MANAGER permissions
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.employee.read', 'org.employee.create', 'org.employee.update', 'org.employee.delete',
    'org.shift.read', 'org.shift.create', 'org.shift.update', 'org.shift.delete', 'org.shift.assign',
    'org.holiday.read', 'org.holiday.create', 'org.holiday.update', 'org.holiday.delete',
    'org.attendance.read', 'org.attendance.create', 'org.attendance.update', 'org.attendance.delete',
    'org.attendance.correct', 'org.attendance.approve',
    'org.mobile.access'
)
WHERE r.code = 'HR_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- Grant BRANCH_MANAGER permissions
INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.employee.read', 'org.employee.update',
    'org.shift.read', 'org.shift.assign',
    'org.holiday.read',
    'org.attendance.read', 'org.attendance.create', 'org.attendance.update',
    'org.attendance.correct', 'org.attendance.approve',
    'org.mobile.access'
)
WHERE r.code = 'BRANCH_MANAGER' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- Ensure EMPLOYEE role exists and grant self-service permissions
INSERT INTO org_roles (code, name, description, is_system, organization_id)
SELECT 'EMPLOYEE', 'Employee', 'Standard employee role for mobile self-service', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM org_roles WHERE code = 'EMPLOYEE' AND organization_id IS NULL);

INSERT INTO org_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM org_roles r
JOIN permissions p ON p.code IN (
    'org.holiday.read',
    'org.attendance.correct',
    'org.mobile.access'
)
WHERE r.code = 'EMPLOYEE' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;
