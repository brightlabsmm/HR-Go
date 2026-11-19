-- Application patch versions. Platform-level table: no organization_id.
-- patch_version is exactly 00.00.00 (two digits per segment).
-- is_current marks the single current row.
--
-- Rollback (manual, not run by cmd/migrate):
--   DROP TABLE IF EXISTS application_patch_versions;

CREATE TABLE IF NOT EXISTS application_patch_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patch_version VARCHAR(8) NOT NULL,
    patch_date_time TIMESTAMPTZ NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_application_patch_versions_patch_version UNIQUE (patch_version),
    CONSTRAINT chk_application_patch_versions_format CHECK (patch_version ~ '^[0-9]{2}[.][0-9]{2}[.][0-9]{2}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_application_patch_versions_current
    ON application_patch_versions (is_current)
    WHERE is_current;

INSERT INTO application_patch_versions (patch_version, patch_date_time, is_current)
VALUES ('01.00.01', TIMESTAMPTZ '2026-11-19 15:14:00+07', TRUE)
ON CONFLICT (patch_version) DO NOTHING;
