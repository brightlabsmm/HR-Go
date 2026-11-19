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
go run ./cmd/seed                            # seeds data; also resets the superadmin password
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

## Application patch versions

`application_patch_versions` stores each application patch version. `patch_version` is exactly `00.00.00` (two digits, a dot, two digits, a dot, two digits). `patch_date_time` is the PatchDateTime. `is_current` is the current-version flag, and only one row may be current.

Every `git push` reads the current row, bumps `patch_version`, and inserts one new row. Increment the last segment by 1. When a segment would pass `99`, set it to `00` and add 1 to the segment on its left (`01.00.99` becomes `01.01.00`, `01.99.99` becomes `02.00.00`). Do not bump past `99.99.99`. The new row's `patch_date_time` is the current time, its `is_current` is true, and the previous current row is set to false in the same database transaction.

The hook script is `.githooks/pre-push`. It runs `go run ./cmd/bumpversion` in `backend/`. The program is named bumpversion because Windows treats an executable whose name contains patch as an installer and will not start it from the hook. That command reads `DATABASE_URL` from the environment or from `backend/.env` and inserts the row. It does not print the database URL. Git itself has no database client, so the hook's command is the write path. Copy `.githooks/pre-push` to `.git/hooks/pre-push` and mark it executable, or set `git config core.hooksPath .githooks`. If that database cannot be reached or rejects authentication, the hook exits non-zero and inserts nothing. It does not fall back to another database. Do not pass `--no-verify`: that skips the insert. Git has no client hook after a successful push, and this repository's GitHub Actions do not connect to the application database. Apply migrations before the first bump so the seeded current row `01.00.01` exists.
