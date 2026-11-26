---
name: add-backend-module
description: Use when adding a new backend feature module under internal/modules. Covers all packages, routing, migration, and OpenAPI.
---

# Add a backend module

Template: `backend/internal/modules/workspace/branch/`. Replace `<area>` with `workspace` (tenant-scoped, per organization) or `control` (platform admin), and `<name>` with the feature (lowercase, singular). Examples below use `widget`.

Do not invent business rules, DB fields or API contracts. If the spec is missing, ask. Rules: `.claude/rules/backend-code-format.md`, `.claude/rules/backend-testing.md`.

## Steps

1. **Create the eight packages** under `backend/internal/modules/<area>/<name>/`. Keep these exact names (`models`, not `model`; no `dto/`):
   `handler/ mapper/ models/ repository/ request/ response/ routes/ service/`, each with one file named after the package (`handler.go`, `service.go`, ...).

2. **Migration first.** Follow the `add-migration` skill. The table needs `organization_id` (workspace), a unique `(organization_id, code)` constraint, a status CHECK, and the `org.<name>.*` permission rows. Do this before the code so the GORM model matches a real table.

3. **`models/models.go`**: GORM struct plus `TableName()`.
   - `ID string` with `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`.
   - `OrganizationID string` with `gorm:"type:uuid;not null"` (workspace modules).
   - `Status string` with `gorm:"default:'ACTIVE'"`, `CreatedAt`, `UpdatedAt`.
   - No Gin or JSON tags in models.

4. **`request/request.go`**: `Create<Name>Request` (`binding:"required"` on mandatory fields, camelCase `json` tags), `Update<Name>Request` (pointer fields so omitted means unchanged), `List<Name>sQuery` (`form` tags: `q`, `status`, `page`, `pageSize`, `sortBy`, `sortDirection`). Never include `id`, `organizationId` or `status` in create/update bodies. **Codes:** branches and departments no longer take a code from the client (it is generated, see step 7). Only add a client-supplied `<Name>Code` (like positions) when the spec says the user types it; for a generated code, leave it out of both request structs.

5. **`response/response.go`**: `<Name>Response` with camelCase JSON. Never expose password hashes, tokens or unintended columns. Do not reuse request structs.

6. **`mapper/mapper.go`**: `To<Name>Response(*models.X)` and `To<Name>List([]models.X)`. Data conversion only, with no DB access or logic.

7. **`repository/repository.go`**: exported `Repository` interface, private `repository` struct, `New(db *gorm.DB) Repository`.
   - Every method takes `ctx` and, for workspace modules, `orgID`, and every query filters `organization_id = ?`. A query without it leaks data across tenants.
   - `FindBy*` returns `(nil, nil)` on `gorm.ErrRecordNotFound`.
   - `List` returns `([]models.X, int64, error)`: clamp `pageSize` to 1-100 (default 20), whitelist `sortBy` columns (never interpolate raw input), `ASC`/`DESC` only.
   - Use parameterized queries only. No Gin imports.
   - **Generated codes** (see `branch` and `department` repositories): in `Create`, open `r.db.WithContext(ctx).Transaction(...)`, read the format from `organization_settings` (`setting_key = codeformat.SettingKey<Name>CodeFormat`, falling back to `codeformat.Default<Name>CodeFormat` and inserting the default), count the organization's rows, then loop `codeformat.Format(format, seq, default)` until `LOWER(code)` is unused in that organization, set `b.Code`, and create. Add the key and default constants in `internal/shared/codeformat/codeformat.go`, seed the default when an organization is created (`control/organization/repository`) and in `cmd/seed`, and backfill existing organizations in a new migration. The service must not read or validate a code from the request.

8. **`service/service.go`**: exported `Service` interface, private `service` struct, `New(repo)`.
   - Signatures take `ctx`, `orgID`, and return `(*response.X, *apperrors.Error)`. `List` returns `(items, page, pageSize, total, *apperrors.Error)`.
   - Repo failure becomes `apperrors.Internal()`, missing record becomes `apperrors.NotFound("<Name> not found")`, duplicate code or bad input becomes `apperrors.ValidationFailed([]apperrors.FieldIssue{{Field: "...", Message: "..."}})` or `BadRequest`.
   - Check that any referenced entity (parent, branch, ...) belongs to the same `orgID`. For generated codes the service no longer checks for duplicates; the repository guarantees uniqueness.
   - Deactivate by setting `Status = "INACTIVE"`; do not hard-delete.
   - No Gin imports.

9. **`handler/handler.go`**: `Handler{svc}` and `New(svc)`. Read `claims := security.GetClaims(c)`, pass `claims.OrganizationID` and `c.Request.Context()` to the service, and answer with `responses.Created`, `OK`, `Page` or `responses.Fail(c, appErr)`. Bind with `ShouldBindJSON` or `ShouldBindQuery`. No GORM calls here.

10. **`routes/routes.go`**: `Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware)`.
    - Group path `/workspace/<names>` (or `/control/<names>`), then `group.Use(sec.RequireWorkspace())` (or `RequirePlatform()`).
    - Per route: `sec.RequirePermission("org.<name>.<create|read|update|deactivate>")`.
    - Standard set: `POST ""`, `GET ""`, `GET "/:<name>Id"`, `PATCH "/:<name>Id"`, `POST "/:<name>Id/deactivate"`.

11. **Wire into bootstrap** in `backend/internal/bootstrap/app.go`, inside the `if deps.DB != nil { ... }` block next to the sibling modules: add the four imports with aliases (`<name>handler`, `<name>repo`, `<name>routes`, `<name>svc`), then
    ```go
    widgetRepo := widgetrepo.New(deps.DB)
    widgetService := widgetsvc.New(widgetRepo)
    widgetroutes.Register(v1, widgethandler.New(widgetService), secMiddleware)
    ```

12. **Grant permissions.** New `org.*` codes must be in the migration and attached to `ORG_ADMIN` (the seed in migration 001 does this via `CROSS JOIN` for the scope at that time; a later migration must insert the role-permission rows explicitly).

13. **OpenAPI.** Run the `api-contract-sync` skill: add paths and schemas to both OpenAPI copies, then add the frontend types.

14. **Tests** go under `backend/test/unit/modules/<area>/<name>/<layer>/` (never `*_test.go` beside production code), using external packages (`package service_test`). Cover service error paths and the tenant filter. Existing tests only cover shared packages (`responses`, `codeformat`, config, logging, middleware, bootstrap), so copy the style of `backend/test/unit/shared/codeformat/codeformat_test.go` (table-driven) or `responses_test.go`.

## Done checklist

Run from `backend/`:

- [ ] `gofmt -l .` prints nothing
- [ ] `go vet ./...` passes
- [ ] `go test -race ./test/unit/...` passes
- [ ] `go build ./...` passes
- [ ] Every repository query filters `organization_id`; handlers contain no GORM; services and repositories do not import Gin
- [ ] Request and response DTOs are separate; no sensitive fields in responses
- [ ] Migration added and applied (`go run ./cmd/migrate`), and the new endpoints were actually called and the results checked
- [ ] Both OpenAPI files updated identically
- [ ] No new `*_test.go` under `internal/` or `cmd/`
