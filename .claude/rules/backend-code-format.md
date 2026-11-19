---
description: HRGo backend coding rules — feature modules with separate routes, handlers, mappers, models, request, response, services, and repositories
paths:
  - "**/*.go"
alwaysApply: false
---

# HRGo Backend Cursor Rules

Apply these rules when creating, editing, reviewing, or refactoring Go code in HRGo.

## 1. Architecture

- Use Go, Gin, GORM, PostgreSQL, and REST/JSON.
- Use a **feature-oriented layered monolith** deployed as one backend application.
- Organize feature code under `internal/modules/<module_name>/`.
- This is conventional layered architecture, not a requirement to use DDD. Do not introduce aggregates, bounded contexts, domain events, or mandatory separate domain/persistence models unless explicitly requested or justified.
- Inspect the existing repository before changing package layout or conventions.
- Do not invent business rules, database fields, workflows, or API contracts that have not been specified.

## 2. Required package naming convention

For each feature module, follow this package structure as the default:

```text
internal/modules/<module_name>/
├── handler/
├── mapper/
├── models/
├── repository/
├── request/
├── response/
├── routes/
└── service/
```

Use the actual feature name in place of `<module_name>`. Example modules may include `auth`, `user`, `role`, `payroll`, and `attendance`.

**Do not collapse or rename these packages without an explicit reason and approval.**

- Keep the package named `models/`; do not rename it to `model/`.
- Keep `request/` and `response/` separate.
- Do not combine request and response DTOs into a generic `dto/` package merely to reduce package count.
- Keep `mapper/` separate when it is used for mapping between API DTOs, service data, and models.
- Keep `routes/` separate from `handler/`; route registration should not be buried inside handler implementations.
- Keep `repository/` separate from `service/`.
- Do not merge layers just because a module is initially small. If you believe a package should be omitted or combined, explain the concrete benefit and ask for approval before changing the established convention.
- Do not create empty folders or placeholder files for packages a module does not yet need. The naming/layout is the standard for implemented module responsibilities, not a requirement to add unused code.

Shared technical infrastructure should live in the project's shared locations, such as `internal/config`, `internal/database`, `internal/security`, `internal/logging`, `internal/observability`, `internal/middleware`, `internal/shared`, and `internal/bootstrap`, following the repository's existing conventions. Do not duplicate equivalent shared infrastructure in every module.

## 3. Layer responsibilities

### `routes/`

- Register module endpoints and attach middleware/handlers.
- Keep routing declarations focused on HTTP wiring.
- Do not implement application logic or database access in route registration.

### `handler/`

- Use Gin to parse path/query/body input, invoke services, and write HTTP responses.
- Keep handlers thin and focused.
- Validate transport input and map results/errors to appropriate HTTP status codes.
- Do not run GORM queries or put substantial application logic in handlers.
- Keep `*gin.Context` and HTTP-specific concerns in this layer.
- Do not pass `*gin.Context` into services or repositories.

### `request/`

- Define request DTOs and request-specific validation structures.
- Do not use request DTOs as GORM persistence models.
- Do not bind untrusted input directly into persistence models if it could permit unintended field updates.
- Exclude server-controlled fields from client-writable request structures.

### `response/`

- Define response DTOs and API response structures.
- Return only fields the caller is authorized to see.
- Never expose passwords, password hashes, tokens, internal secrets, or unintended database fields.
- Do not reuse request DTOs as response DTOs simply to save types.

### `mapper/`

- Convert between request DTOs, service inputs/results, models, and response DTOs when a mapping boundary is useful.
- Keep mappers focused on data transformation.
- Do not put database access, HTTP handling, or business logic in mappers.
- Avoid unnecessary conversions where a direct and safe assignment is clearer, but do not remove the mapper package or move all mapping logic into handlers without an explicit reason.

### `service/`

- Implement application logic and coordinate repository operations.
- Apply application-level validation and authorization checks where appropriate.
- Define transaction boundaries deliberately.
- Return results and errors; do not write HTTP responses.
- Do not import Gin or HTTP response packages.
- Keep services cohesive and avoid one giant service for unrelated operations.

### `repository/`

- Encapsulate GORM and PostgreSQL access.
- Implement persistence operations, query composition, filtering, and pagination.
- Handle persistence-specific errors and return errors to callers.
- Do not import Gin or return HTTP responses.
- Use context-aware database operations where appropriate.
- Use parameterized query APIs; never concatenate untrusted input into SQL.

### `models/`

- Define module data structures and GORM persistence models where appropriate.
- Keep the package name `models`; do not change it to `model`.
- Use GORM tags intentionally.
- Keep HTTP framework types out of models.
- Separate persistence models from request/response DTOs when needed to avoid API/schema coupling or accidental data exposure.
- Do not require separate domain and persistence representations everywhere; add extra representations only for a concrete benefit.

## 4. Dependency direction

Preferred flow:

`Routes -> Handler -> Service -> Repository -> GORM/PostgreSQL`

Mappers and DTO packages support data conversion at the boundaries.

- Lower layers must not import higher layers.
- Services and repositories must not depend on Gin.
- Handlers must not bypass services/repositories to access the database.
- Avoid circular imports within or between modules.
- When a module needs another module, prefer a small explicit service interface or application operation instead of importing its repository implementation.
- Wire concrete dependencies explicitly in bootstrap code.
- Use interfaces when they improve a boundary or testing, not mechanically for every type.
- Avoid global service locators and hidden dependencies.

## 5. Go style and errors

- Format Go code with `gofmt`; use `goimports` if configured.
- Follow idiomatic Go naming and package conventions.
- Keep functions focused and control flow readable.
- Prefer early returns when they improve clarity.
- Handle errors deliberately; wrap errors with `%w` when preserving the underlying error is useful.
- Do not ignore errors or use `panic` for ordinary application failures.
- Comment exported declarations and non-obvious behavior.
- Avoid magic values, unnecessary global mutable state, premature optimization, and needless abstractions.
- Follow existing project conventions rather than introducing competing patterns.

## 6. Gin and API practices

- Use consistent routing, middleware, request validation, and JSON response conventions.
- Validate path parameters, query parameters, and request bodies.
- Use appropriate HTTP methods and status codes.
- Map application errors to HTTP responses at the handler boundary.
- Do not expose stack traces, raw SQL, credentials, or internal implementation details to clients.
- Configure recovery, request IDs, logging, CORS, security headers, request limits, timeouts, and rate limiting as required.
- Support health/readiness checks and graceful shutdown.

## 7. GORM and PostgreSQL

- Keep GORM usage in repositories wherever practical.
- Check database errors and distinguish not-found from unexpected failures using established project conventions.
- Avoid N+1 queries and fetch only needed data.
- Use transactions for operations that must be atomic.
- Keep transaction handling consistent and avoid spreading GORM-specific transaction types through unrelated layers.
- Use reviewed, version-controlled migrations for schema changes.
- Do not automatically apply unreviewed schema changes during production startup.
- Do not invent schema constraints or business rules without requirements.
- Never log credentials or sensitive query parameters.

## 8. Security and configuration

- Treat external input as untrusted.
- Authentication and authorization are separate; verify permissions for protected operations.
- If the application manages passwords, use an appropriate password-hashing algorithm and never store plaintext passwords.
- Keep secrets in environment-specific configuration or a secret manager.
- Never commit real credentials, tokens, private keys, or production `.env` files.
- Redact tokens, passwords, and sensitive personal information from logs.
- Use least-privilege database credentials and validate required configuration at startup.

## 10. Before finishing

For each backend change:

1. Verify that code is in the correct feature module and package.
2. Confirm handlers do not access GORM directly and services do not depend on Gin.
3. Confirm request and response DTOs remain separate.
4. Confirm mappers contain data conversion only.
5. Check error handling, authorization, and sensitive-data exposure.
6. Format changed Go files and run relevant tests under `backend/test/` when available (`go test ./test/unit/...` and, when DB is configured, `go test ./test/integration/...`).
7. If the change adds or fixes an API, retest it and update that phase's `api-test.md`.
8. Summarize the change and disclose checks that could not be run.
9. Confirm no new `*_test.go` files were added under `internal/` or `cmd/`.

## Application patch versions

`application_patch_versions` stores each application patch version. `patch_version` is exactly `00.00.00` (two digits, a dot, two digits, a dot, two digits). `patch_date_time` is the PatchDateTime. `is_current` is the current-version flag, and only one row may be current.

Every `git push` reads the current row, bumps `patch_version`, and inserts one new row. Increment the last segment by 1. When a segment would pass `99`, set it to `00` and add 1 to the segment on its left (`01.00.99` becomes `01.01.00`, `01.99.99` becomes `02.00.00`). Do not bump past `99.99.99`. The new row's `patch_date_time` is the current time, its `is_current` is true, and the previous current row is set to false in the same database transaction.

The hook script is `.githooks/pre-push`. It runs `go run ./cmd/bump-patch-version` in `backend/`. That command reads `DATABASE_URL` from the environment or from `backend/.env` and inserts the row. It does not print the database URL. Git itself has no database client, so the hook's command is the write path. Copy `.githooks/pre-push` to `.git/hooks/pre-push` and mark it executable, or set `git config core.hooksPath .githooks`. A push with no reachable database fails the hook and inserts nothing. Do not pass `--no-verify`: that skips the insert. Git has no client hook after a successful push, and this repository's GitHub Actions do not connect to the application database. Apply migrations before the first bump so the seeded current row `01.00.01` exists.

## Changed Logs

| Date | Time | Author | Change |
|---|---|---|---|
| 2026-11-19 | 15:26 | thanthtooaung-coding | Added the application patch version bump rule for every git push. |
| 2026-11-12 | 11:09 | thanthtooaung-coding | Reset change logs for HR-Go and added the Time column. |
