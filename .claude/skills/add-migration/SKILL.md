---
name: add-migration
description: Use when changing the database schema or seeding permissions and roles. Covers numbering, tenant isolation, indexes, idempotency, and rollback notes.
---

# Add a migration

Migrations are hand-written SQL in `backend/migrations/`. There is no GORM `AutoMigrate`. `backend/cmd/migrate/main.go` applies each `*.sql` file in filename order, one transaction per file, and records the name in `schema_migrations`. A file is never re-run once recorded, so **never edit an applied migration**; add a new one.

## Steps

1. **Pick the next number.**
   ```bash
   ls backend/migrations
   ```
   Take the highest `NNN_` prefix, add one (zero-padded to 3 digits), and name it `NNN_<short_snake_description>.sql`. Today the only file is `001_phase0_phase1_schema.sql`, so the next is `002_...`.

2. **Write idempotent statements** (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT ... DO NOTHING`). The runner splits on `;` outside `$$ ... $$` blocks, so avoid stray semicolons in comments or strings, and keep DO blocks inside `$$`.

3. **Table conventions** (copy `branches` in migration 001):
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `created_at` / `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'` with a `CHECK (status IN ('ACTIVE','INACTIVE'))` named `chk_<table>_status`
   - Name constraints `uq_<table>_<cols>`; foreign keys state `ON DELETE` explicitly (`CASCADE` for the organization, `RESTRICT` or `SET NULL` for peers).

4. **Organization isolation.** Every tenant-owned table gets `organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE`. Business-unique keys are scoped to the tenant: `CONSTRAINT uq_<table>_org_code UNIQUE (organization_id, code)` (or a `LOWER(...)` unique index if the match is case-insensitive). Child rows referencing another tenant table must be validated in the service (same `orgID`); the database does not enforce that across tables. Platform-level tables carry no `organization_id`. The schema has no row-level security, so isolation relies on every repository query filtering `organization_id`.

5. **Indexes.** Add `idx_<table>_org ON <table> (organization_id, status)` at minimum, plus indexes for each filter or sort column used in list queries. Index foreign keys that are joined or filtered.

6. **Permissions.** For a new resource insert codes into `permissions` (`scope` `'ORG'` or `'PLATFORM'`, `resource`, `action`, `description`) following `org.<resource>.<create|read|update|deactivate>`, with `ON CONFLICT (code) DO NOTHING`. Then attach them explicitly to roles (`org_role_permissions` for `ORG_ADMIN`, `platform_role_permissions` for `SUPERADMIN`), since the earlier `CROSS JOIN` seed only covered permissions that existed when migration 001 ran. Permission and role changes only reach users at their next login (tokens carry permissions for 24h).

7. **Rollback note.** The runner has no down migrations. Put a comment block at the top of the file:
   ```sql
   -- Rollback (manual, not run by cmd/migrate):
   --   DROP TABLE IF EXISTS widgets;
   --   DELETE FROM permissions WHERE code LIKE 'org.widget.%';
   ```
   Prefer additive, backward-compatible changes (new nullable columns, new tables). For destructive changes, split into two migrations across releases.

8. **Match the code.** Update the GORM model in `backend/internal/modules/**/models/models.go` (types, `not null`, defaults) so it agrees with the SQL.

9. **Apply and verify** against a scratch database (needs `DATABASE_URL`):
   ```bash
   cd backend && go run ./cmd/migrate
   ```
   Run it twice; the second run must log "already applied". Confirm constraints and indexes exist with `\d <table>` in psql.

## Done checklist

- [ ] File is `backend/migrations/NNN_<description>.sql`, numbered after the highest existing file
- [ ] No applied migration was edited
- [ ] Tenant tables have `organization_id` with FK, tenant-scoped unique constraint, and `(organization_id, status)` index
- [ ] Status `CHECK`, explicit `ON DELETE`, idempotent (`IF NOT EXISTS` / `ON CONFLICT`)
- [ ] Permissions inserted and attached to the right roles
- [ ] Rollback comment present
- [ ] GORM model matches the SQL; `go run ./cmd/migrate` runs clean twice
- [ ] `docs/api` and OpenAPI updated if the API changes (`api-contract-sync`)
