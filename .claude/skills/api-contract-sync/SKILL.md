---
name: api-contract-sync
description: Use when an API endpoint, request or response shape changes. Keeps the Go handlers, both OpenAPI copies, and the frontend service types in agreement.
---

# Keep the API contract in sync

The contract exists in four places that must agree:

1. Go DTOs: `backend/internal/modules/<area>/<name>/{request,response}/` and routes in `routes/routes.go`.
2. `docs/api/openapi.yaml`
3. `backend/internal/apidocs/openapi.yaml`: embedded into the binary and served at `/openapi.yaml` and `/docs`. It is a hand-maintained **copy** of #2 and must stay byte-identical.
4. Frontend types in `frontend/src/shared/services/<name>.service.ts`.

The human-readable contract is `docs/api/HRGo_API_Contract_Phase_0_and_1_v1_2.md`. Update it too when behavior changes, and add a row to its `## Changed Logs` table if it has one (`.claude/rules/documentation.md`).

## Steps

1. **Settle the Go side first.** JSON tag names are the contract: camelCase, for example `branchCode`. List query params use `form` tags (`q, status, page, pageSize, sortBy, sortDirection`). Lists return `{items, page, pageSize, totalItems, totalPages}` through `responses.Page`.

2. **Edit `docs/api/openapi.yaml`.** Under `paths:` copy the shape of `/api/v1/workspace/branches` and `/{branchId}` (around lines 1386-1560):
   - `tags: [Workspace - <Names>]`, `summary`, a `description` stating the required permission (`Requires \`org.<name>.read\`.`), and `security: - BearerAuth: []`.
   - Responses reuse `#/components/responses/{BadRequest,Unauthorized,Forbidden,Conflict,ValidationError}`.
   - Add schemas under `components.schemas` (for example `Create<Name>Request`, `<Name>`) and `$ref` them. Required fields must match `binding:"required"`.

3. **Copy to the embedded spec.**
   ```bash
   cp docs/api/openapi.yaml backend/internal/apidocs/openapi.yaml
   diff -q docs/api/openapi.yaml backend/internal/apidocs/openapi.yaml && echo in sync
   ```
   (Edit `docs/api/` only, then copy. Never hand-edit the copy alone.)

4. **Update the frontend types** in the matching `*.service.ts`: the entity interface, input interface and list-params interface must mirror the schema field for field (optional vs nullable included). `toListQuery` already maps `limit` to `pageSize`, `search` to `q`, and uppercases `status`; any new query param must be mapped there or passed through. Compare against the real response, not just old code: the current `Branch` interface lists `createdAt` and `updatedAt`, but `BranchResponse` in Go does not send them.

5. **Check the permission string** in `routes.go`, the OpenAPI description, the `permissions` seed (see `add-migration`), and the frontend nav entry's `permission`. They must be the same code.

6. **Verify by running it.** Start the server (`cd backend && go run ./cmd/server`), call each changed endpoint for the success and error paths, and confirm the live JSON matches the schema. Open `http://localhost:8080/docs` to confirm the spec still renders.

## Done checklist

- [ ] Go DTO tags, `routes.go` paths and permission codes match the spec
- [ ] `docs/api/openapi.yaml` updated and `diff -q` against the apidocs copy prints nothing
- [ ] Contract markdown updated if behavior changed
- [ ] Frontend service types match the schema (fields, optionality, nullability)
- [ ] `cd backend && go build ./...` passes (the spec is embedded, so a missing file breaks the build)
- [ ] `cd frontend && yarn typecheck` passes
- [ ] Endpoints called manually and responses match the spec
