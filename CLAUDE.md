# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

HRGo is a multi-tenant HR/payroll platform for Myanmar organizations. Monorepo: `backend/` (Go, Gin, GORM, PostgreSQL) and `frontend/` (React 19, Vite, TypeScript, Tailwind 4, shadcn). `mobile/` (Expo) is planned but does not exist yet. The root README still lists the frontend as "planned"; it is stale.

## Commands

Backend (run from `backend/`):

```bash
go build ./...
go vet ./...
gofmt -l .                                   # CI fails if this prints anything
go test -race ./test/unit/...                # what CI runs
go test ./test/unit/config -run TestName     # single package / single test
go run ./cmd/server                          # needs DATABASE_URL (see .env.example); without it, starts with NO /api/v1 routes
go run ./cmd/migrate                         # applies migrations/*.sql (hand-written SQL, no AutoMigrate)
go run ./cmd/seed                            # seeds data; also resets the superadmin password and sets default code formats
```

Frontend (run from `frontend/`, Yarn):

```bash
yarn dev              # organization portal (alias dev:org); yarn dev:platform for the platform portal
yarn build:org        # or build:platform; runs tsc -b first
yarn lint
yarn typecheck
yarn test             # vitest run
yarn vitest run src/util/phone.test.ts   # single test file
```

## Backend architecture

Layered monolith. Dependencies are wired by hand in `internal/bootstrap/app.go` (`NewEngine`), with no DI framework. Flow: `routes -> handler -> service -> repository -> GORM`.

- Modules live in `internal/modules/{control,workspace}/<name>/` with fixed sub-packages: `handler, mapper, models, repository, request, response, routes, service`. Keep the names exactly (`models`, not `model`; no combined `dto/`).
- Two tenancy realms:
  - `control/` is the platform-admin side (auth, organization, role, user), guarded by `RequirePlatform()`.
  - `workspace/` is per-organization (auth, branch, department, position, role), guarded by `RequireWorkspace()`.
- Auth is HS256 JWT (`internal/shared/security`). Claims carry `ctx` (PLATFORM or WORKSPACE), `org_id`, and a `perms` list, all fixed at login for 24h. Routes add `RequirePermission("org.branch.read")` etc. `platform.all` and `org.all` act as wildcards.
- Tenant isolation is by convention. Workspace services take `orgID` from the token claims and every repository query must filter on `organization_id`. A new workspace repository method without that filter is a cross-tenant leak.
- Services return `*apperrors.Error` (`internal/shared/errors`), and handlers render it via `internal/shared/responses`. Services and repositories must not import Gin.
- Paginated lists clamp `pageSize` to 1–100 (default 20) and whitelist sort columns.
- Branch and department codes are generated server-side: the repository `Create` runs in a transaction, reads `branch_code_format` / `department_code_format` from `organization_settings` (defaults `BR-{0000}`, `DEPT-{0000}`, from `internal/shared/codeformat`), and takes the next free sequence number. The create requests carry no code. Positions still take `positionCode` from the client. Organization creation seeds the default settings.
- Migrations are `backend/migrations/NNN_*.sql`, applied in order by `cmd/migrate`. `organization_settings` is defined in both `001` (fresh installs) and `002` (existing databases), so both must stay idempotent and agree.
- The API contract is `docs/api/openapi.yaml`, and `backend/internal/apidocs/openapi.yaml` is an identical copy served by the app. Update both together.
- Tests live under `test/unit/`, not next to the code. Domain modules currently have none.

Config (`internal/config`) falls back to a dev JWT secret and default superadmin credentials when env vars are unset. The superadmin is also upserted on every server boot.

## Frontend architecture

- One codebase builds two portals, chosen by `VITE_PORTAL` (`.env.organization` / `.env.platform`) through Vite `--mode`. Portal-specific nav and routes live in `src/portals/{platform,organization}`, and `src/routes/router.tsx` plus `src/app/portal.ts` select between them.
- Data flow: `app/api` (axios instance) -> `shared/services/*.service.ts` (raw calls) -> `shared/queries/*.query.ts` (TanStack Query hooks) -> pages. Components call queries, never services directly.
- `features/<name>/{components,hooks,pages}` holds feature code. Anything used by 2+ features moves to `components/common` or `shared/`. `components/ui` is shadcn primitives (add with `yarn shadcn add <component>`).
- Global state is Zustand (`shared/stores`). The auth store persists to browser storage.
- File names are kebab-case with PascalCase component exports. Do not add normalizer or mapper layers for API responses unless the shape really needs it.

## Conventions from `.claude/rules/`

- Backend: do not invent business rules, DB fields or API contracts. Keep handlers thin, never bind request DTOs straight into persistence models, and never expose password hashes or tokens in responses.
- i18n: locales are `en`, `my` and `th` under `frontend/src/locales/<lang>/`, and a new key goes in all three. In `my`, write mostly Burmese. Keep only these loanwords in English: platform, account, admin, email, password, user, role, permission, profile, portal, tenant. Buttons and nav labels (Save, Cancel, Settings, Sign in…) must be translated. `en` stays fully English.
- Docs: when editing a file matched by `.claude/rules/documentation.md` (README.md, `docs/**/*.md`, the backend and frontend READMEs, the backend rule files), add a row at the top of its `## Changed Logs` table at the end of the file. Use the date, time, `git config user.name` as author, and a one-sentence change. Never edit `docs/phase_0/**`.
