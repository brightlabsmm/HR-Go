---
name: pre-pr-check
description: Use before opening or updating a pull request. Runs every lint, type, test and build command for the parts of the repo that changed, then reviews the diff against the project rules.
---

# Pre-PR check

The default branch is `dev`. Work out what changed first, then run only the relevant sections.

```bash
git diff --stat dev...HEAD
git status --short
```

## 1. Backend (if `backend/` changed)

Run from `backend/`. These mirror `.github/workflows/server-ci.yaml`, which fails the PR on any of them:

```bash
test -z "$(gofmt -l .)" || gofmt -l .      # must print nothing
go vet ./...
go test -race ./test/unit/...
go build -o /dev/null ./cmd/server
```

Also run `go test ./test/integration/...` if that directory exists and `TEST_APP_DATABASE_URL` is set. If you changed an endpoint or migration, apply the migration (`go run ./cmd/migrate`) and call the endpoint.

## 2. Frontend (if `frontend/` changed)

Run from `frontend/`. There is no frontend CI workflow, so this is the only gate:

```bash
yarn typecheck
yarn lint
yarn test
yarn build:org        # and yarn build:platform if platform code or shared code changed
```

If you touched locale files, run the key-parity script from the `add-translation` skill.

## 3. Contract and docs

- API changed: `diff -q docs/api/openapi.yaml backend/internal/apidocs/openapi.yaml` prints nothing (`api-contract-sync`).
- Docs changed (`README.md`, `docs/**/*.md`, backend/frontend READMEs, `.claude/rules/backend-*.md`): a new row is at the top of that file's `## Changed Logs` table, with date, time, `git config user.name` as author, and one sentence. `docs/phase_0/**` is untouched.

## 4. Review the diff against the rules

Read `git diff dev...HEAD` and check each point; report anything you could not verify.

Backend (`.claude/rules/backend-code-format.md`, `backend-testing.md`):
- [ ] Code sits in the right module and package; names are `models`, `request`, `response`, `mapper` (no `dto/`, no merges)
- [ ] Handlers do no GORM; services and repositories do not import Gin
- [ ] Every workspace repository query filters `organization_id`; cross-entity ids are checked against the same org
- [ ] Routes use `RequireWorkspace` / `RequirePlatform` and a specific `RequirePermission`
- [ ] Responses expose no password hashes, tokens or internal fields; request DTOs are not bound straight into models
- [ ] SQL is parameterized; `sortBy` is whitelisted; no secrets or real credentials committed
- [ ] New tests live under `backend/test/`, none beside code in `internal/` or `cmd/`
- [ ] No broad refactors or invented fields/contracts beyond the task

Frontend (`.claude/rules/frontend-rule.md`):
- [ ] Kebab-case files, one component per file, correct folder (`core / common / ui / layouts / features`)
- [ ] Components use `shared/queries`, not services; no leftover `console.log`
- [ ] Every user-facing string is translated in all four locales, `my` uses the light mix
- [ ] Nav `permission` and action gating use the same codes as the backend

General:
- [ ] Diff contains only files related to the task (no stray `.env`, build output or editor files)
- [ ] Commit messages and PR description explain the change; checks you could not run are named

## Report

Finish with a short list: commands run and result for each, items that failed or were skipped (and why), and any review findings.
