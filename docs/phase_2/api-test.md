# Phase 2 API & Automated Test Report

## Environment & Test Execution Scope

- **Repository:** `brightlabsmm/HR-Go` (base branch `dev`)
- **Automated Unit / Static Checks Executed:**
  - Go Backend (`go vet ./...`, `go test ./test/unit/...`, `go build -o NUL ./cmd/server`) passed across all targeted backend PR branches:
    - PR #72 (`fix/phase-2-mobile-backend-fixes`): `mobile` service tests passed.
    - PR #73 (`fix/phase-2-tenant-and-attendance-logic`): `employee`, `shift`, `holiday`, and `attendance` service tests passed.
    - PR #76 (`feat/phase-2-erd-entities-and-audit`): all 25 Go unit test packages passed, including `branchhours`, `lifecycle`, `attendanceimport`, and `auditlog`.
    - PR #77 (`feat/phase-2-leave-and-overtime`): all 27 Go unit test packages passed, including `leave` and `overtime`.
  - Frontend (`yarn lint`, `yarn typecheck`, `yarn test`, `yarn build:org`, `yarn build:platform`) passed on PR #74 (`24` Vitest files / `92` tests), PR #76 (`22` Vitest files / `89` tests), and PR #77 (`22` Vitest files / `89` tests).
  - Mobile (`tsc --noEmit`) passed on PR #75 (`fix/phase-2-mobile-client-cleanup`) and PR #77 (`feat/phase-2-leave-and-overtime`).
- **Live Database / HTTP Integration Status:**
  - PostgreSQL (`127.0.0.1:5432`) and local Go API server (`127.0.0.1:8080`) were unavailable during this offline verification run (`TCP connect failed`), so live SQL execution of migrations `012_phase2_erd_completion.sql` / `013_phase2_leave_and_overtime.sql` and live HTTP smoke requests against PostgreSQL remain pending environment startup after the remediation PRs merge into `dev`.

## Phase 2 Remediation Pull Requests

| PR | Branch | Scope |
|---|---|---|
| PR #72 | `fix/phase-2-mobile-backend-fixes` | Mobile SQL joins, soft-delete login guard, `org.all` wildcard, 30-day token expiry, `GetProfile` personal/position history, offline `ACCEPTED`/`CONFLICT`/`REJECTED` sync statuses |
| PR #73 | `fix/phase-2-tenant-and-attendance-logic` | Organization ownership guards (`employee`, `shift`, `holiday`, `attendance`), soft-delete session revocation, org-timezone late/early/worked calculations, partial correction merge, SQL summary aggregation |
| PR #74 | `fix/phase-2-frontend-qa-rbac-i18n` | Web RBAC gating, `noValidate` + Zod validations, `notifyApiError` feedback, local date/time ISO conversion, query key isolation, complete 4-language (`en`, `my`, `th`, `zh`) i18n |
| PR #75 | `fix/phase-2-mobile-client-cleanup` | Mobile `expo-secure-store` token persistence, auth & `mustChangePassword` navigation guard, mock data removal, strict network-only offline queuing, API type alignment |
| PR #76 | `feat/phase-2-erd-entities-and-audit` | Migration `012`, Branch Operating Hours, Employee Contracts/Documents/Service Years/Exits/Histories, Attendance CSV Import/Export, Workspace Audit Logs + Web UI |
| PR #77 | `feat/phase-2-leave-and-overtime` | Migration `013`, Leave & Overtime Web + Mobile APIs, mobile `/leave` & `/overtime` screen bindings, web approval pages |
| PR 7 (this PR) | `docs/phase-2-openapi-and-api-tests` | Updated OpenAPI 3.0 specifications (`backend/internal/apidocs/openapi.yaml`, `docs/api/openapi.yaml`) and Phase 2 API test documentation |

## Live Verification Command Checklist (Post-Merge on `dev`)

Once PRs #72–#77 are merged into `dev` and PostgreSQL is running:

1. Start database and apply migrations `001` through `013`.
2. Start backend server: `go run ./cmd/server` (from `backend/`).
3. Verify operational & OpenAPI endpoints:
   - `GET /health` -> `200 OK`
   - `GET /ready` -> `200 OK` (`database: UP`)
   - `GET /openapi.yaml` -> `200 OK` (contains Phase 2 paths)
4. Smoke test key Phase 2 workflows:
   - `POST /api/v1/workspace/auth/login` -> acquire workspace JWT
   - `PUT /api/v1/workspace/branches/{branchId}/operating-hours` -> `200 OK`
   - `POST /api/v1/workspace/employees` -> `201 Created` (`generatedPassword` returned once)
   - `POST /api/v1/workspace/employees/{id}/contracts` -> `201 Created`
   - `POST /api/v1/workspace/employees/{id}/service-years/recalculate` -> `200 OK`
   - `POST /api/v1/workspace/attendance/imports` -> `201 Created` (`AttendanceImportBatch`)
   - `GET /api/v1/workspace/attendance/export` -> `200 OK` (`text/csv`)
   - `POST /api/v1/workspace/leave/types` & `POST /api/v1/workspace/mobile/leave/requests` & `POST /api/v1/workspace/leave/requests/{id}/review`
   - `POST /api/v1/workspace/overtime/categories` & `POST /api/v1/workspace/mobile/overtime/requests` & `POST /api/v1/workspace/overtime/requests/{id}/review`
   - `GET /api/v1/workspace/audit-logs` -> `200 OK`

## Changed Logs

| Date | Time | Author | Change |
|---|---|---|---|
| 2026-11-26 | 00:55 | Win Naing Soe | Documented Phase 2 remediation PRs, unit verification coverage, and post-merge API verification checklist. |
