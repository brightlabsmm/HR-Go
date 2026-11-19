---
description: HRGo backend testing rules — test folder layout, test quality, and API verification
paths:
  - "**/*.go"
alwaysApply: false
---

## 9. Testing and change discipline

### 9.1 Test folder layout (Spring Boot–style)

Keep production code under `internal/` / `cmd/`. Keep **all** Go tests under `backend/test/`, mirroring the package under test. Do **not** place `*_test.go` beside production files in `internal/` or `cmd/`.

```text
backend/
├── cmd/                         # application entrypoints (main)
├── internal/                    # production code (like src/main)
│   ├── bootstrap/
│   ├── config/
│   ├── modules/<feature>/...
│   └── shared/...
└── test/                        # all tests (like src/test)
    ├── unit/                    # fast tests; no DB required when possible
    │   ├── bootstrap/
    │   ├── config/
    │   ├── modules/<feature>/<layer>/   # e.g. modules/auth/service/
    │   └── shared/<pkg>/
    └── integration/             # DB / RLS / cross-module tests
        └── tenantisolation/
```

Rules for this layout:

- Mirror the production path under `test/unit/` or `test/integration/` (example: `internal/modules/auth/service` → `test/unit/modules/auth/service`).
- Prefer external test packages: `package config_test`, `package service_test`, `package auth_test`. Import the code under test; do not put tests in the same package as production code unless a temporary exception is approved.
- Unit tests must not depend on a live database when the behavior can be tested without one. Integration tests that need PostgreSQL live under `test/integration/` and skip cleanly when `TEST_APP_DATABASE_URL` is unset.
- Name files `*_test.go`. One focused concern per file when practical (`lifecycle_test.go`, `rbac_test.go`).
- Run unit tests with `go test ./test/unit/...`. Run integration tests with `go test ./test/integration/...`. Prefer `go test ./test/...` before finishing a backend change.
- Do not recreate an empty `internal/...` package that only existed for colocated tests.

### 9.2 Test quality and API verification

- Add or update tests when behavior changes.
- Test service logic, repository/database behavior, HTTP behavior, and error paths at the appropriate layer.
- Use PostgreSQL integration tests for important GORM queries, constraints, migrations, and transactions.
- Keep tests deterministic and independent of production data.
- When you add an API or fix an API, run that API and record the result before the change is finished. A code change without a new run is not done.
- Retest the changed API after every fix. Include the success path, the error paths, and the exact success and error messages.
- Each phase has its own `docs/phase_<n>/api-test.md` (for example `docs/phase_0/api-test.md`). Create that file for the phase when the first API in the phase is tested.
- Update the cases you touched in that phase file. Add a case for a new endpoint. Replace the old result when a fix changes the status, code, or message. Do not leave a result from a run that is no longer true.
- Remove test rows created during the run. Do not leave them in the database.
- Inspect `go.mod` before adding dependencies; avoid overlapping libraries.
- Keep changes focused. Do not perform broad refactors, rename public APIs, or reorganize established packages unless required and approved.
- Do not collapse `models/` into `model/`, combine `request/` and `response/`, remove `mapper/`, or merge `routes/` into `handler/` merely for convenience.
- Run `gofmt` and relevant tests when possible. Report checks that could not be run.
