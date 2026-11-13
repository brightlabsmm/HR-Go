# HRGo API Contract — Phase 0 & Phase 1

**Document ID:** HRGO-API-P01-001  
**Version:** 1.2  
**Date:** 12 November 2026  
**Status:** Draft API contract for engineering review  
**Product baseline:** HRGo Software Requirements Specification v3.0 (approved 10 November 2026)

---

## 1. Purpose

This document defines the proposed backend API contract for the HRGo Phase 0 and Phase 1 tasks.

It is based on:

- The Phase 0 and Phase 1 tasks shown in the HRGo Task Plan & Tracker.
- The approved HRGo Software Requirements Specification (SRS) Version 3.0.
- Only these two areas of `HRGo_Complete_ERD_version1.pdf`:
  - **Platform & Shared Permissions**
  - **Organization Structure & Identity**

The remainder of the ERD is intentionally excluded from this contract. In particular, this document does not define attendance, shifts, holidays, overtime, leave, payroll, employee documents, reporting, or other later-phase modules.

This is an API contract draft, not a claim that these endpoints have already been implemented. Route names and transport conventions below are proposed consistently where the SRS and ERD define business behaviour or data relationships but do not prescribe exact HTTP routes.

## 2. Phase boundary

### 2.1 Phase 0 — Foundation & Setup

| Task | API / engineering contract coverage |
|---|---|
| Requirement review & finalize | Confirm this contract, role catalogue, status transitions, validation rules, and unresolved decisions. |
| System architecture & database schema | Establish API versioning, common response/error format, persistence boundaries, and the in-scope entities in Section 4. |
| Authentication & RBAC | Define separate platform and organization authentication contexts, role/permission checks, and protected-route behaviour. |
| Multi-tenant setup | Enforce organization data isolation and organization-scoped access on every organization endpoint. |
| Project structure, CI/CD & environments | Provide application health/readiness endpoints and consistent configuration and deployment behaviour. |
| Initial UI/UX & common components | Provide stable authentication, list, detail, create/update, status, and error response patterns for the Phase 1 screens. |

### 2.2 Phase 1 — Platform & Organization Foundation

| Task | API / engineering contract coverage |
|---|---|
| Platform Admin (login, user, role / permission) | Platform sign-in, platform user administration, platform role assignment, and permission lookup/management. |
| Organization management (CRUD) | Create, list/search, retrieve, and update customer organization records. |
| Organization profile & status | Retrieve/update organization profile and execute permitted lifecycle status transitions. |
| Branch, department, position (CRUD) | Organization-scoped CRUD and list operations for branches, departments, and positions. |
| Authentication & security foundation | Enforce the two authentication contexts, authorization, tenant isolation, validation, and audit-relevant events. |
| Platform & Organization web screens | Supply the APIs required by the Platform Admin Panel and Organization Admin Panel foundation screens. |

### 2.4 API endpoint summary

The following table is the quick-reference index for all endpoints defined in this Phase 0 and Phase 1 contract. Detailed request/response schemas, validation rules, and permission requirements are specified in the relevant sections below.

#### Control API — Platform administration

| Method | Endpoint | Description | Authentication / access |
|---|---|---|---|
| `POST` | `/api/v1/control/auth/login` | Authenticate a platform user using email and password. | Public; platform credentials |
| `POST` | `/api/v1/control/auth/logout` | End the current platform session or revoke the applicable token. | Platform |
| `GET` | `/api/v1/control/auth/me` | Get the authenticated platform user's profile, roles, and effective permissions. | Platform |
| `GET` | `/api/v1/control/roles` | List platform roles and their permission summaries. | Platform; `platform.role.read` |
| `GET` | `/api/v1/control/permissions` | List permissions, optionally filtered by `PLATFORM` or `ORG` scope. | Platform; `platform.permission.read` |
| `GET` | `/api/v1/control/users` | List and search platform users with pagination. | Platform; `platform.user.read` |
| `POST` | `/api/v1/control/users` | Create a platform user and assign initial platform roles. | Platform; `platform.user.create` |
| `GET` | `/api/v1/control/users/{platformUserId}` | Retrieve a platform user's non-secret profile, status, and roles. | Platform; `platform.user.read` |
| `PATCH` | `/api/v1/control/users/{platformUserId}` | Update permitted platform user profile fields. | Platform; `platform.user.update` |
| `PUT` | `/api/v1/control/users/{platformUserId}/roles` | Replace the platform user's role assignments. | Platform; `platform.role.assign` |
| `POST` | `/api/v1/control/users/{platformUserId}/deactivate` | Deactivate a platform user after server-side validation. | Platform; `platform.user.deactivate` |
| `POST` | `/api/v1/control/users/{platformUserId}/reactivate` | Reactivate a previously deactivated platform user. | Platform; user-management permission to be finalized |
| `POST` | `/api/v1/control/organizations` | Create a customer organization account. | Platform; `platform.organization.create` |
| `GET` | `/api/v1/control/organizations` | List, search, filter, sort, and paginate customer organizations. | Platform; `platform.organization.read` |
| `GET` | `/api/v1/control/organizations/{organizationId}` | Retrieve a customer organization's profile and current status. | Platform; `platform.organization.read` |
| `PATCH` | `/api/v1/control/organizations/{organizationId}` | Update permitted organization profile fields. | Platform; `platform.organization.update` |
| `POST` | `/api/v1/control/organizations/{organizationId}/status` | Request or execute an approved organization lifecycle status transition. | Platform; `platform.organization.status.update` |

#### Workspace API — Organization and employee access

| Method | Endpoint | Description | Authentication / access |
|---|---|---|---|
| `POST` | `/api/v1/workspace/auth/login` | Authenticate an organization user using Employee ID or Employee Code and password. | Public; organization credentials |
| `POST` | `/api/v1/workspace/auth/logout` | End the current organization-user session or revoke the applicable token. | Workspace |
| `GET` | `/api/v1/workspace/auth/me` | Get the authenticated account, linked employee identity, organization, roles, and effective permissions. | Workspace |
| `POST` | `/api/v1/workspace/branches` | Create a branch in the authenticated organization. | Workspace; `org.branch.create` |
| `GET` | `/api/v1/workspace/branches` | List and filter branches belonging to the authenticated organization. | Workspace; `org.branch.read` |
| `GET` | `/api/v1/workspace/branches/{branchId}` | Retrieve a branch within the authenticated organization. | Workspace; `org.branch.read` |
| `PATCH` | `/api/v1/workspace/branches/{branchId}` | Update permitted branch fields without changing its organization. | Workspace; `org.branch.update` |
| `POST` | `/api/v1/workspace/branches/{branchId}/deactivate` | Deactivate a branch after checking references and business constraints. | Workspace; `org.branch.deactivate` |
| `POST` | `/api/v1/workspace/departments` | Create a department, optionally associated with a branch. | Workspace; `org.department.create` |
| `GET` | `/api/v1/workspace/departments` | List and filter departments in the authenticated organization. | Workspace; `org.department.read` |
| `GET` | `/api/v1/workspace/departments/{departmentId}` | Retrieve a department within the authenticated organization. | Workspace; `org.department.read` |
| `PATCH` | `/api/v1/workspace/departments/{departmentId}` | Update permitted department fields and validate its branch relationship. | Workspace; `org.department.update` |
| `POST` | `/api/v1/workspace/departments/{departmentId}/deactivate` | Deactivate a department after checking data-integrity constraints. | Workspace; `org.department.deactivate` |
| `POST` | `/api/v1/workspace/positions` | Create a position, optionally associated with a department. | Workspace; `org.position.create` |
| `GET` | `/api/v1/workspace/positions` | List and filter positions in the authenticated organization. | Workspace; `org.position.read` |
| `GET` | `/api/v1/workspace/positions/{positionId}` | Retrieve a position within the authenticated organization. | Workspace; `org.position.read` |
| `PATCH` | `/api/v1/workspace/positions/{positionId}` | Update permitted position fields and validate its department relationship. | Workspace; `org.position.update` |
| `POST` | `/api/v1/workspace/positions/{positionId}/deactivate` | Deactivate a position after checking references. | Workspace; `org.position.deactivate` |
| `GET` | `/api/v1/workspace/roles` | List organization roles available to the authenticated organization. | Workspace; `org.role.read` |
| `PUT` | `/api/v1/workspace/accounts/{accountId}/roles` | Replace an organization account's role assignments and optional branch/department scopes. | Workspace; role-assignment permission to be finalized |

#### Operational endpoints

| Method | Endpoint | Description | Authentication / access |
|---|---|---|---|
| `GET` | `/health` | Check whether the application process is alive. | Public or infrastructure-restricted; deployment decision |
| `GET` | `/ready` | Check whether the application and required dependencies are ready to serve requests. | Public or infrastructure-restricted; deployment decision |

**Route rule:** Platform administration endpoints use only `/api/v1/control/...`. Organization and employee workspace endpoints use only `/api/v1/workspace/...`. The operational health endpoints are infrastructure endpoints and are not part of either business namespace.

**Authentication note:** “Public” for the two login endpoints means no existing access token is required. The credentials are still validated by the relevant authentication service. All other business endpoints require the indicated authentication context and server-side authorization.

---

### 2.3 Explicitly out of scope

The following are not part of this Phase 0/1 contract:

- Employee onboarding and full employee profile management.
- Attendance, check-in/check-out, attendance correction, and imports/exports.
- Shift schedules, branch operating hours, and holidays.
- Overtime and leave.
- Employee exit, KPI, contracts, employee documents, and service-year calculations.
- Payroll, benefits, tax, and social-security calculations.
- Reports and report-form management.
- Employee mobile application APIs.
- Notifications and third-party integrations.

The ERD contains entities for later modules. Their presence in the ERD does not bring them into this API scope.

---

## 3. Contract conventions

### 3.1 Base URL and versioning

All application APIs use the versioned base path:

```text
/api/v1
```

Examples:

```text
POST /api/v1/control/auth/login
GET  /api/v1/control/organizations
GET  /api/v1/workspace/branches
```

The deployed host and port are environment-specific and are not fixed by this document.

Only two API namespaces are used:

- `/api/v1/control/...` — Platform Admin APIs, including platform authentication, platform users/roles/permissions, and customer organization administration.
- `/api/v1/workspace/...` — Organization and Employee APIs, including organization authentication, organization structure, and employee-facing APIs in later phases.

Do not introduce separate `/platform`, `/org`, or root-level `/organizations` API namespaces. Platform-managed customer organization CRUD remains under `/control/organizations`; organization users operate within their authenticated workspace under `/workspace/...`.

### 3.2 Content type

Requests with JSON bodies:

```http
Content-Type: application/json
Accept: application/json
```

Successful JSON responses use `application/json`.

### 3.3 Identifier conventions

- Entity IDs are opaque identifiers generated by the server.
- Clients must treat IDs as strings and must not construct IDs.
- `organization_code`, `branch_code`, `department_code`, and `position_code` are business identifiers, not substitutes for entity IDs.
- The SRS requires a unique, system-generated organization identifier and a unique organization code.
- Code uniqueness for branches, departments, and positions must be enforced within the applicable organization unless the approved business rule specifies a stricter scope.

### 3.4 Dates and timestamps

- Date-only values use `YYYY-MM-DD`.
- Timestamps use ISO 8601 with an explicit timezone/offset.
- Server-generated audit and login timestamps are authoritative.
- Organization/branch timezone behaviour must follow the approved configuration. The SRS does not define the final timezone storage policy.

### 3.5 Pagination, sorting, and filtering

List endpoints use the following query convention:

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | 1-based page number; default `1`. |
| `pageSize` | integer | Requested page size; server applies a configured maximum. |
| `sortBy` | string | Approved sortable field. |
| `sortDirection` | `asc` / `desc` | Sort direction. |
| `q` | string | Optional text search where supported. |
| `status` | string | Optional status filter where supported. |

The SRS requires organization list search/filter by name, organization code, status, and creation date, plus pagination and sorting. The exact maximum page size and supported sort fields are implementation configuration.

Standard paginated response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

### 3.6 Common success response

For single-resource operations, the API returns the resource directly:

```json
{
  "id": "opaque-id",
  "status": "ACTIVE"
}
```

For create operations, return `201 Created` and a `Location` header where practical. For successful updates, return `200 OK` with the updated resource or `204 No Content` if the endpoint is explicitly designed to return no body.

### 3.7 Common error response

All API errors use a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "organizationCode",
        "message": "This organization code is already in use."
      }
    ],
    "traceId": "request-correlation-id"
  }
}
```

`details` may be an empty array. Do not expose stack traces, SQL details, password hashes, secrets, or internal infrastructure information.

Common HTTP statuses:

| HTTP status | Meaning |
|---|---|
| `400` | Malformed request or invalid query parameter. |
| `401` | Missing, invalid, or expired authentication. |
| `403` | Authenticated user lacks the required permission or scope. |
| `404` | Resource does not exist or is not visible in the caller's permitted scope. |
| `409` | Duplicate business identifier or conflicting lifecycle operation. |
| `422` | Request is syntactically valid but fails business validation. |
| `500` | Unexpected server error. |

---

## 4. In-scope data model

This section records only the ERD entities within the two requested areas.

### 4.1 Platform & Shared Permissions

| ERD entity | Fields shown in the ERD | Contract purpose |
|---|---|---|
| `PLATFORM_USER` | `id`, `full_name`, `email` (unique), `password_hash`, `status`, `last_login_at` | Platform administrator identity and sign-in. |
| `PLATFORM_SETTING` | `id`, `setting_key` (unique), `setting_value` | Platform-level key/value settings. |
| `PERMISSION` | `id`, `permission_scope` (`PLATFORM` / `ORG`), `permission_code`, `description`, unique `(scope, code)` | Shared permission catalogue. |
| `PLATFORM_ROLE` | `id`, `role_code` (unique), `role_name` | Platform role definitions. |
| `PLATFORM_USER_ROLE` | `id`, `platform_user_id`, `platform_role_id` | Many-to-many platform user/role assignment. |
| `PLATFORM_ROLE_PERMISSION` | `id`, `platform_role_id`, `permission_id` | Many-to-many platform role/permission assignment. |
| `ORGANIZATION` | `id`, `organization_code` (unique), `legal_name`, `display_name`, `contact_email`, `contact_phone`, `country`, `address`, `status` | Customer organization account. |
| `ORGANIZATION_SETTING` | `id`, `organization_id`, `setting_key`, `setting_value` | Organization-level key/value settings. |

The ERD shows `PERMISSION.permission_scope` as `PLATFORM/ORG` and a uniqueness rule on `(scope, code)`. The API must not treat a platform permission as an organization permission, or vice versa.

### 4.2 Organization Structure & Identity

| ERD entity | Fields shown in the ERD | Contract purpose |
|---|---|---|
| `BRANCH` | `id`, `organization_id`, `parent_id` (nullable), `branch_code`, `branch_name`, `address`, `status` | Organization branch and optional parent-branch relationship. |
| `DEPARTMENT` | `id`, `organization_id`, `branch_id` (nullable), `department_code`, `department_name`, `status` | Organization department, optionally associated with a branch. |
| `POSITION` | `id`, `organization_id`, `department_id` (nullable), `position_code`, `position_name`, `status` | Organization position, optionally associated with a department. |
| `EMPLOYEE` | `id`, `organization_id`, `branch_id`, `department_id`, `position_id`, `full_name`, `email`, `phone`, `date_of_joining`, `employment_status` | Employee identity reference used by organization access. Full employee management is outside this phase. |
| `ORGANIZATION_ACCOUNT` | `id`, `organization_id`, `employee_id`, `employee_code`, `password_hash`, `account_status`, `mobile_access_enabled`, `last_login_at`, `is_current` | Organization/employee login account. |
| `ORG_ROLE` | `id`, `role_code` (unique), `role_name` | Organization role catalogue. |
| `ORG_ROLE_PERMISSION` | `id`, `role_id`, `permission_id` | Organization role/permission assignment. |
| `ORG_USER_ROLE` | `id`, `organization_account_id`, `role_id`, `branch_id` (nullable), `department_id` (nullable) | Organization account role assignment with optional branch/department scope. |

**Identity boundary:** The SRS states that organization users authenticate using Employee ID or Employee Code and password. The ERD depicts `ORGANIZATION_ACCOUNT.employee_code` and a link to `EMPLOYEE`. This contract therefore uses the organization account as the credential-bearing record and does not treat `EMPLOYEE.email` as the organization login identifier.

**Important ERD alignment note:** The ERD does not show an `employee_code` field on `EMPLOYEE`; it shows `employee_code` on `ORGANIZATION_ACCOUNT`. The API accepts the SRS login identifier wording (Employee ID or Employee Code), but the exact mapping of “Employee ID” to a stored identifier must be confirmed before implementation. Do not silently assume that it means the database primary key.

### 4.3 Relationships relevant to this phase

- One organization has many branches.
- A branch may have a nullable parent branch (`BRANCH.parent_id`).
- One organization has many departments; a department may optionally reference a branch.
- One organization has many positions; a position may optionally reference a department.
- An employee identity record references its organization and may reference a branch, department, and position.
- An organization account references an organization and an employee.
- An organization account may have multiple role assignments.
- An organization role may have multiple permissions through `ORG_ROLE_PERMISSION`.
- A platform user may have multiple platform roles through `PLATFORM_USER_ROLE`.
- A platform role may have multiple permissions through `PLATFORM_ROLE_PERMISSION`.

All foreign-key ownership and tenant constraints must be validated by the server, not trusted from client-supplied IDs.

---

## 5. Authentication contract

The SRS defines two separate authentication contexts. Credentials are not interchangeable.

### 5.1 Platform authentication

**Actors:** `Superadmin`, `Platform Support`  
**Login identifier:** Registered email address  
**Credential:** Password

#### `POST /api/v1/control/auth/login`

Request:

```json
{
  "email": "admin@example.com",
  "password": "plain-text-password"
}
```

Success `200 OK`:

```json
{
  "accessToken": "token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "platform-user-id",
    "fullName": "Platform Administrator",
    "email": "admin@example.com",
    "status": "ACTIVE",
    "roles": [
      {
        "roleCode": "SUPERADMIN",
        "roleName": "Superadmin"
      }
    ],
    "permissions": [
      "platform.organization.read"
    ]
  }
}
```

The token format and expiry are implementation choices and must be confirmed by the engineering team. The response illustrates the required separation of platform identity, roles, and effective permissions; it does not prescribe a JWT claim format.

Expected failures:

- `400` — missing or malformed email/password fields.
- `401` — invalid credentials.
- `403` — platform account is inactive/deactivated.
- `429` — sign-in rate limit exceeded, if rate limiting is enabled.

On successful login, update `PLATFORM_USER.last_login_at`. Record successful and failed sign-in events as required by `PLT-FR-005`.

#### `POST /api/v1/control/auth/logout`

Requires platform authentication.

Success: `204 No Content`.

The implementation must invalidate the relevant session/token if the selected authentication mechanism supports server-side revocation. If access tokens are stateless, the revocation strategy must be documented separately.

#### `GET /api/v1/control/auth/me`

Requires platform authentication.

Returns the authenticated platform user, assigned roles, and effective permissions using the same `user` representation as the login response.

### 5.2 Organization / employee authentication

**Actors:** `Org Admin`, `Org Support`, `Branch Manager`, `HR manager`, `HR Support`, `Department Manager`, `Employee`  
**Login identifier:** Employee ID or Employee Code  
**Credential:** Password

#### `POST /api/v1/workspace/auth/login`

Request:

```json
{
  "identifier": "EMP-001",
  "password": "plain-text-password"
}
```

Success `200 OK`:

```json
{
  "accessToken": "token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "organizationId": "organization-id",
    "organizationCode": "ORG-001",
    "accountId": "organization-account-id",
    "employeeId": "employee-id",
    "employeeCode": "EMP-001",
    "fullName": "Example User",
    "accountStatus": "ACTIVE",
    "roles": [
      {
        "roleCode": "ORG_ADMIN",
        "roleName": "Org Admin",
        "branchId": null,
        "departmentId": null
      }
    ],
    "permissions": [
      "org.branch.read"
    ]
  }
}
```

Expected failures:

- `400` — missing identifier or password.
- `401` — invalid credentials.
- `403` — organization account is inactive, not current, or otherwise not permitted to sign in.
- `429` — sign-in rate limit exceeded, if enabled.

On successful login, update `ORGANIZATION_ACCOUNT.last_login_at`.

The account's organization, employee association, status, and role scope must be resolved server-side. The client must not choose the organization context by sending an arbitrary `organizationId` during login.

#### `POST /api/v1/workspace/auth/logout`

Requires organization authentication.

Success: `204 No Content`.

#### `GET /api/v1/workspace/auth/me`

Requires organization authentication.

Returns the authenticated organization account, linked employee identity, assigned roles/scopes, and effective permissions.

### 5.3 Authentication separation

| Rule | Required behaviour |
|---|---|
| Platform login | Uses `/platform/auth/login` and platform email/password. |
| Organization login | Uses `/auth/login` and Employee ID/Employee Code plus password. |
| Credential separation | Platform credentials must not authenticate through the organization login flow, or vice versa. |
| Context separation | Platform routes require a platform principal; organization routes require an organization principal. |
| Organization context | Derived from the authenticated organization account, not trusted from request body or query parameters. |
| Password storage | Store password hashes only. Never return `password_hash` in an API response. |
| Account status | Inactive/deactivated accounts cannot access protected routes. |

---

## 6. Authorization and shared permissions

### 6.1 Platform roles

The approved SRS role catalogue includes:

| Role code (proposed stable code) | Display name |
|---|---|
| `SUPERADMIN` | Superadmin |
| `PLATFORM_SUPPORT` | Platform Support |

The role codes above are proposed API identifiers. Confirm them against the seed-data convention before implementation.

### 6.2 Organization roles

The approved SRS organization role catalogue includes:

| Role code (proposed stable code) | Display name |
|---|---|
| `ORG_ADMIN` | Org Admin |
| `ORG_SUPPORT` | Org Support |
| `BRANCH_MANAGER` | Branch Manager |
| `HR_MANAGER` | HR manager |
| `HR_SUPPORT` | HR Support |
| `DEPARTMENT_MANAGER` | Department Manager |
| `EMPLOYEE` | Employee |

The role codes above are proposed API identifiers. Actual permission assignment must follow the approved role/permission matrix; this document does not invent role grants.

### 6.3 Permission evaluation

A protected request is allowed only when all applicable checks pass:

1. The request is authenticated in the correct context.
2. The account is active and permitted to access the application.
3. The principal has the required permission.
4. For organization requests, the target resource belongs to the principal's organization.
5. If a role assignment is branch- or department-scoped, the target resource is within that permitted scope.
6. The requested operation is valid for the resource's current state.

Platform permissions use `permission_scope = PLATFORM`. Organization permissions use `permission_scope = ORG`.

### 6.4 Permission code convention

Permission codes use a consistent resource/action format. The following are proposed examples for Phase 1 and must be seeded consistently:

| Permission code | Meaning |
|---|---|
| `platform.user.read` | View platform users. |
| `platform.user.create` | Create platform users. |
| `platform.user.update` | Update platform users. |
| `platform.user.deactivate` | Deactivate platform users. |
| `platform.role.read` | View platform roles and permissions. |
| `platform.role.assign` | Assign platform roles to users. |
| `platform.permission.read` | View permission catalogue. |
| `platform.organization.create` | Create customer organizations. |
| `platform.organization.read` | View/search customer organizations. |
| `platform.organization.update` | Update organization profiles. |
| `platform.organization.status.update` | Request/execute permitted organization status changes. |
| `org.branch.create` | Create branches. |
| `org.branch.read` | View/list branches. |
| `org.branch.update` | Update branches. |
| `org.branch.deactivate` | Deactivate branches. |
| `org.department.create` | Create departments. |
| `org.department.read` | View/list departments. |
| `org.department.update` | Update departments. |
| `org.department.deactivate` | Deactivate departments. |
| `org.position.create` | Create positions. |
| `org.position.read` | View/list positions. |
| `org.position.update` | Update positions. |
| `org.position.deactivate` | Deactivate positions. |
| `org.role.read` | View organization roles and permissions. |
| `org.role.assign` | Assign organization roles to accounts. |

The SRS requires role-based access control but does not provide the final permission-code catalogue or role-to-permission matrix. The examples above are a proposed naming baseline, not approved grants.

### 6.5 Role and permission endpoints

#### `GET /api/v1/control/roles`

Platform authenticated. Requires `platform.role.read`.

Returns platform roles and their permission summaries.

#### `GET /api/v1/control/permissions`

Platform authenticated. Requires `platform.permission.read`.

Query parameters:

- `scope=PLATFORM` or `scope=ORG`
- `page`, `pageSize`

Returns permissions filtered by scope.

#### `GET /api/v1/control/users`

Platform authenticated. Requires `platform.user.read`.

Returns a paginated list of platform users. Never include password hashes.

#### `POST /api/v1/control/users`

Platform authenticated. Requires `platform.user.create`.

Request:

```json
{
  "fullName": "Platform Support User",
  "email": "support@example.com",
  "password": "initial-password",
  "roleIds": ["platform-role-id"]
}
```

Success: `201 Created`.

The server hashes the password and creates the platform user and role assignments transactionally. The SRS allows an authorized Superadmin to create platform administrator accounts.

#### `GET /api/v1/control/users/{platformUserId}`

Requires `platform.user.read`.

Returns the user profile, status, roles, and relevant non-secret account metadata.

#### `PATCH /api/v1/control/users/{platformUserId}`

Requires `platform.user.update`.

Request fields are limited to approved editable fields, such as:

```json
{
  "fullName": "Updated Name",
  "email": "updated@example.com"
}
```

Do not allow clients to update `password_hash`, `last_login_at`, or system-managed fields.

#### `PUT /api/v1/control/users/{platformUserId}/roles`

Requires `platform.role.assign`.

Request:

```json
{
  "roleIds": ["platform-role-id"]
}
```

Replaces the user's platform role assignments. Validate every role ID and write an audit event.

#### `POST /api/v1/control/users/{platformUserId}/deactivate`

Requires `platform.user.deactivate`.

Requires explicit confirmation in the UI and server-side validation. Success returns the updated account status. Record the privileged change in audit history.

#### `POST /api/v1/control/users/{platformUserId}/reactivate`

Requires the corresponding platform user management permission. Success returns the updated account status and records the change.

**Note:** The SRS requires platform administrator create, update, deactivate, and reactivate operations. The exact permission split for update/deactivate/reactivate must be confirmed in the approved permission matrix.

---

## 7. Platform organization management API

All endpoints in this section require platform authentication and the relevant platform permission.

### 7.1 Create organization

#### `POST /api/v1/control/organizations`

Permission: `platform.organization.create`

Request:

```json
{
  "organizationCode": "ORG-001",
  "legalName": "Example Company Limited",
  "displayName": "Example Company",
  "contactEmail": "contact@example.com",
  "contactPhone": "+959000000000",
  "country": "MM",
  "address": "Yangon, Myanmar"
}
```

Success: `201 Created`.

Response:

```json
{
  "id": "organization-id",
  "organizationCode": "ORG-001",
  "legalName": "Example Company Limited",
  "displayName": "Example Company",
  "contactEmail": "contact@example.com",
  "contactPhone": "+959000000000",
  "country": "MM",
  "address": "Yangon, Myanmar",
  "status": "PENDING",
  "createdAt": "2026-11-12T10:00:00+07:00",
  "updatedAt": "2026-11-12T10:00:00+07:00"
}
```

Rules:

- `id` is generated by the server.
- `organizationCode` is required and unique.
- Required/optional status of individual profile fields must be finalized in field validation rules.
- The initial status shown as `PENDING` is a proposed default consistent with the SRS lifecycle statuses; confirm the default with the Product Owner.
- Record organization creation in audit history.

### 7.2 List and search organizations

#### `GET /api/v1/control/organizations`

Permission: `platform.organization.read`

Supported query parameters:

| Parameter | Description |
|---|---|
| `q` | Search organization name/display name/code. |
| `organizationCode` | Exact or partial organization-code filter, as configured. |
| `status` | `PENDING`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`. |
| `createdFrom` | Inclusive creation date lower bound. |
| `createdTo` | Inclusive creation date upper bound. |
| `page`, `pageSize` | Pagination. |
| `sortBy`, `sortDirection` | Sorting. |

Success: `200 OK` with the standard paginated response.

The SRS specifically requires search/filter by name, organization code, status, and creation date, pagination, sorting, and a clear empty-result response.

### 7.3 Retrieve organization

#### `GET /api/v1/control/organizations/{organizationId}`

Permission: `platform.organization.read`

Returns the organization profile and current platform status.

If the organization does not exist, return `404`.

### 7.4 Update organization profile

#### `PATCH /api/v1/control/organizations/{organizationId}`

Permission: `platform.organization.update`

Request:

```json
{
  "legalName": "Example Company Limited",
  "displayName": "Example Group",
  "contactEmail": "new-contact@example.com",
  "contactPhone": "+959111111111",
  "country": "MM",
  "address": "Mandalay, Myanmar"
}
```

Rules:

- Only permitted profile fields may be updated.
- `id` and system-generated timestamps cannot be supplied as update fields.
- `organizationCode` changes, if allowed, require an explicit business decision and uniqueness validation. The SRS requires uniqueness but does not explicitly define whether the code is immutable.
- Record the before/after change in audit history.

### 7.5 Organization lifecycle status

Approved SRS lifecycle values:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `ARCHIVED`

The SRS states that status transitions require approval. It also requires explicit confirmation for high-impact actions such as suspending an organization.

#### `POST /api/v1/control/organizations/{organizationId}/status`

Permission: `platform.organization.status.update`

Request:

```json
{
  "status": "SUSPENDED",
  "reason": "Administrative suspension",
  "confirmation": true
}
```

Success: `200 OK` with the updated organization.

Rules:

- Validate the requested transition against the approved lifecycle transition matrix.
- Require explicit confirmation for high-impact transitions.
- Do not assume all transitions are allowed.
- Record actor, previous status, new status, reason (if collected), and timestamp.
- Return `409` for an invalid transition and `403` if the user lacks permission.

**Decision required:** The SRS says transitions require approval but does not define the transition matrix, approval workflow, or whether approval is performed inside or outside this API. Those details must be approved before the endpoint is finalized.

### 7.6 Organization settings

The ERD includes `ORGANIZATION_SETTING`, but the Phase 1 tracker does not explicitly list settings management as a separate task. Do not expose general-purpose settings CRUD in Phase 1 unless the Product Owner confirms it is required for the Phase 1 screens.

---

## 8. Organization structure API

All endpoints in this section require organization authentication. The organization ID is taken from the authenticated principal. A client must not be able to access another organization's data by changing a path or query parameter.

All Organization and Employee APIs use the `/api/v1/workspace/` namespace. The authenticated organization account determines the workspace and organization context; clients do not select another organization through the URL.

### 8.1 Branches

ERD fields: `id`, `organization_id`, nullable `parent_id`, `branch_code`, `branch_name`, `address`, `status`.

#### `POST /api/v1/workspace/branches`

Permission: `org.branch.create`

Request:

```json
{
  "branchCode": "YGN-01",
  "branchName": "Yangon Main Branch",
  "parentId": null,
  "address": "Yangon, Myanmar"
}
```

Success: `201 Created`.

Response:

```json
{
  "id": "branch-id",
  "organizationId": "organization-id",
  "parentId": null,
  "branchCode": "YGN-01",
  "branchName": "Yangon Main Branch",
  "address": "Yangon, Myanmar",
  "status": "ACTIVE"
}
```

Rules:

- `organizationId` is assigned from the authenticated organization context.
- If `parentId` is provided, the parent branch must belong to the same organization.
- `branchCode` uniqueness must be enforced within the applicable organization.
- The SRS requires branch name, code, address, contact details, and status as approved branch information. The supplied ERD branch entity does not show contact fields. Do not persist or expose branch contact fields until the ERD/schema is updated or the Product Owner confirms the additional fields.
- Initial `ACTIVE` status is a proposed default and must be confirmed.

#### `GET /api/v1/workspace/branches`

Permission: `org.branch.read`

Query parameters: `q`, `status`, `page`, `pageSize`, `sortBy`, `sortDirection`.

Returns only branches belonging to the authenticated organization.

#### `GET /api/v1/workspace/branches/{branchId}`

Permission: `org.branch.read`.

Returns one branch only if it belongs to the authenticated organization.

#### `PATCH /api/v1/workspace/branches/{branchId}`

Permission: `org.branch.update`.

Request:

```json
{
  "branchName": "Yangon Head Office",
  "parentId": null,
  "address": "Updated address"
}
```

Only approved editable fields may be changed. `organizationId` cannot be changed through this endpoint.

#### `POST /api/v1/workspace/branches/{branchId}/deactivate`

Permission: `org.branch.deactivate`.

Deactivates the branch after checking references and business constraints. The SRS requires preventing unauthorized branch changes. The ERD uses a `status` field; a soft-deactivation approach is proposed rather than physical deletion.

### 8.2 Departments

ERD fields: `id`, `organization_id`, nullable `branch_id`, `department_code`, `department_name`, `status`.

#### `POST /api/v1/workspace/departments`

Permission: `org.department.create`

Request:

```json
{
  "departmentCode": "HR",
  "departmentName": "Human Resources",
  "branchId": null
}
```

Success: `201 Created`.

Response:

```json
{
  "id": "department-id",
  "organizationId": "organization-id",
  "branchId": null,
  "departmentCode": "HR",
  "departmentName": "Human Resources",
  "status": "ACTIVE"
}
```

Rules:

- Organization ID comes from the authenticated context.
- `branchId` may be null; if supplied, it must belong to the same organization.
- Prevent deactivation/deletion when it would violate employee or organizational references, as required by `ORG-FR-014`.
- Department code uniqueness is enforced within the applicable organization.

#### `GET /api/v1/workspace/departments`

Permission: `org.department.read`.

Query parameters: `q`, `branchId`, `status`, `page`, `pageSize`, `sortBy`, `sortDirection`.

Returns only departments belonging to the authenticated organization.

#### `GET /api/v1/workspace/departments/{departmentId}`

Permission: `org.department.read`.

#### `PATCH /api/v1/workspace/departments/{departmentId}`

Permission: `org.department.update`.

Request:

```json
{
  "departmentName": "People & Culture",
  "branchId": null
}
```

The API must validate any supplied branch belongs to the same organization.

#### `POST /api/v1/workspace/departments/{departmentId}/deactivate`

Permission: `org.department.deactivate`.

Must enforce the data-integrity rule in `ORG-FR-014`.

### 8.3 Positions

ERD fields: `id`, `organization_id`, nullable `department_id`, `position_code`, `position_name`, `status`.

#### `POST /api/v1/workspace/positions`

Permission: `org.position.create`

Request:

```json
{
  "positionCode": "HR-MANAGER",
  "positionName": "HR Manager",
  "departmentId": "department-id"
}
```

Success: `201 Created`.

Response:

```json
{
  "id": "position-id",
  "organizationId": "organization-id",
  "departmentId": "department-id",
  "positionCode": "HR-MANAGER",
  "positionName": "HR Manager",
  "status": "ACTIVE"
}
```

Rules:

- Organization ID comes from the authenticated context.
- `departmentId` may be null; if supplied, it must belong to the same organization.
- Position code uniqueness is enforced within the applicable organization.
- Do not allow a position to reference a department from another organization.

#### `GET /api/v1/workspace/positions`

Permission: `org.position.read`.

Query parameters: `q`, `departmentId`, `status`, `page`, `pageSize`, `sortBy`, `sortDirection`.

#### `GET /api/v1/workspace/positions/{positionId}`

Permission: `org.position.read`.

#### `PATCH /api/v1/workspace/positions/{positionId}`

Permission: `org.position.update`.

Request:

```json
{
  "positionName": "Senior HR Manager",
  "departmentId": "department-id"
}
```

#### `POST /api/v1/workspace/positions/{positionId}/deactivate`

Permission: `org.position.deactivate`.

Must check references before deactivation. The SRS requires create/view/update/deactivate and position assignment/history, but position assignment and history are outside the Phase 1 tracker scope and are not defined here.

---

## 9. Organization role assignment and identity foundation

The ERD contains `ORGANIZATION_ACCOUNT`, `ORG_ROLE`, `ORG_ROLE_PERMISSION`, and `ORG_USER_ROLE`. The Phase 1 tracker includes authentication/security foundation, while the detailed employee lifecycle is outside this phase.

### 9.1 Organization role lookup

#### `GET /api/v1/workspace/roles`

Requires organization authentication and `org.role.read`.

Returns the organization role catalogue available to the authenticated organization. The approved display names are listed in Section 6.2.

### 9.2 Organization account role assignment

#### `PUT /api/v1/workspace/accounts/{accountId}/roles`

Requires an authorized organization role-assignment permission. The exact permission code and which Phase 1 actor may perform this action must be confirmed in the role/permission matrix.

Proposed request:

```json
{
  "assignments": [
    {
      "roleId": "org-role-id",
      "branchId": null,
      "departmentId": null
    }
  ]
}
```

Rules:

- The account must belong to the authenticated organization.
- Every role must belong to the organization role catalogue.
- Optional branch and department scopes must belong to the same organization.
- A role assignment with no branch/department scope is organization-wide only if the approved permission model allows it.
- The endpoint must not grant permissions that are not attached to the assigned role.
- Record role assignment changes in audit history.

**Scope note:** This endpoint documents the identity/RBAC foundation represented by the selected ERD area. If organization account creation or employee onboarding is not included in the Phase 1 implementation backlog, do not implement account provisioning as part of this endpoint.

---

## 10. Platform and organization settings

The selected ERD area includes `PLATFORM_SETTING` and `ORGANIZATION_SETTING`. The Phase 1 tracker does not identify settings CRUD as a named deliverable.

For Phase 0, the backend must support environment-based configuration for deployment and application operation. That configuration is not the same thing as exposing database-backed platform/organization settings to end users.

Do not create public settings CRUD endpoints in Phase 1 without an approved requirement and permission definition.

---

## 11. Multi-tenant and data-integrity requirements

These requirements apply to every organization-context endpoint.

1. Resolve the organization from the authenticated organization account.
2. Never trust a client-provided `organizationId` as proof of access.
3. For every branch, department, position, employee identity, organization account, and role assignment lookup, verify organization ownership.
4. Validate parent-child relationships within the same organization.
5. Apply role scope from `ORG_USER_ROLE.branch_id` and `ORG_USER_ROLE.department_id` where those values are assigned.
6. Do not reveal whether another organization's resource exists. Return the standard not-found response when it is outside the caller's permitted tenant scope.
7. Apply the same authorization rules to detail, list, create, update, deactivate, and relationship-validation operations.
8. Use database foreign keys and uniqueness constraints in addition to application-level validation.
9. Perform multi-record operations, such as role assignment replacement, transactionally.
10. Do not physically delete records where doing so would break approved references or history. Use status-based deactivation where appropriate.

The SRS requires tenant isolation across UI, APIs, exports, reports, and object references. This Phase 0/1 contract applies that requirement to the endpoints in scope.

---

## 12. Audit and security requirements

### 12.1 Events to record

At minimum, the SRS requires recording:

- Successful and failed platform sign-in attempts.
- Platform administrator role, permission, and account-status changes.
- Organization creation.
- Organization profile changes.
- Organization lifecycle status changes.
- Privileged actions and affected records.

The ERD includes an audit area, but its entities are outside the two ERD areas selected for API modelling in this document. The API must still emit the required audit events through the separately implemented audit subsystem. This contract does not redefine the audit schema.

### 12.2 Security controls

- HTTPS/TLS for sensitive network traffic.
- Password hashing; never store or return plaintext passwords.
- Server-side authorization for every protected operation.
- Rate limiting and safe handling of repeated failed login attempts.
- Generic authentication failure messages that do not disclose whether an account exists.
- Input validation and safe output serialization.
- No password hashes, secrets, or internal error details in responses or logs.
- Correlation/trace ID on requests and error responses.
- Structured security logs.
- Explicit confirmation for high-impact platform operations.

---

## 13. Phase 0 operational endpoints

These endpoints support application startup, deployment, and environment verification. They do not expose business data.

### `GET /health`

Returns process liveness.

Example:

```json
{
  "status": "UP"
}
```

### `GET /ready`

Returns readiness of required application dependencies.

Example:

```json
{
  "status": "READY",
  "checks": {
    "database": "UP"
  }
}
```

If the database or another required dependency is unavailable, return an appropriate non-2xx status. Do not expose credentials, connection strings, host secrets, or sensitive infrastructure details.

The exact health-check paths may be adapted to the deployment platform, but liveness and readiness must remain distinguishable.

---

## 14. Validation and conflict rules

| Condition | Expected result |
|---|---|
| Duplicate organization code | `409 CONFLICT`. |
| Duplicate branch code within organization | `409 CONFLICT`. |
| Duplicate department code within organization | `409 CONFLICT`. |
| Duplicate position code within organization | `409 CONFLICT`. |
| Unknown organization/branch/department/position ID | `404 NOT_FOUND` within caller scope. |
| Parent branch belongs to another organization | `422 VALIDATION_ERROR`. |
| Department branch belongs to another organization | `422 VALIDATION_ERROR`. |
| Position department belongs to another organization | `422 VALIDATION_ERROR`. |
| Organization account attempts to access another tenant | `404 NOT_FOUND` or `403 FORBIDDEN` according to the consistent resource-concealment policy. |
| User lacks required permission | `403 FORBIDDEN`. |
| Inactive account attempts sign-in | `403 FORBIDDEN`. |
| Invalid organization lifecycle transition | `409 CONFLICT`. |
| Deactivation would violate references | `409 CONFLICT` with a safe explanatory message. |

---

## 15. Acceptance checklist

### Phase 0

- [ ] API project builds and starts in the configured development environment.
- [ ] Environment-specific configuration is externalized.
- [ ] Database migrations can be applied consistently.
- [ ] Liveness and readiness checks work.
- [ ] Common success, pagination, and error formats are implemented.
- [ ] Platform and organization authentication contexts are separate.
- [ ] RBAC middleware/service enforces permission checks server-side.
- [ ] Tenant isolation is enforced for organization data.
- [ ] Automated tests cover authentication, authorization, and cross-tenant access denial.
- [ ] CI pipeline runs formatting, static checks, and automated tests.

### Phase 1 — Platform foundation

- [ ] Superadmin and Platform Support can authenticate using email/password.
- [ ] Inactive platform users cannot sign in.
- [ ] Authorized Superadmin can create, update, deactivate, and reactivate platform users.
- [ ] Platform roles can be assigned to platform users.
- [ ] Platform permissions are separated from organization permissions.
- [ ] Authorized platform users can create and view organizations.
- [ ] Organization profile can be updated.
- [ ] Organization list supports search, filtering, pagination, and sorting.
- [ ] Organization code uniqueness is enforced.
- [ ] Organization lifecycle statuses are supported.
- [ ] Status changes follow the approved transition/approval rules.
- [ ] Platform security and organization lifecycle actions are audited.

### Phase 1 — Organization foundation

- [ ] Organization users authenticate using Employee ID or Employee Code plus password.
- [ ] Organization account resolves its organization and linked employee identity server-side.
- [ ] Organization users cannot access another organization's data.
- [ ] Branch CRUD/list operations enforce tenant ownership.
- [ ] Department CRUD/list operations enforce tenant ownership and optional branch ownership.
- [ ] Position CRUD/list operations enforce tenant ownership and optional department ownership.
- [ ] Organization roles and scoped assignments are resolved server-side.
- [ ] Unauthorized branch/department-scoped access is denied.
- [ ] Deactivation checks preserve data integrity.

---

## 16. Open decisions before implementation

The following items are not fully specified by the SRS or selected ERD area and must be confirmed. They are deliberately not silently assumed in this contract.

| # | Decision | Why it matters |
|---|---|---|
| 1 | Token/session mechanism, expiry, refresh, and revocation | SRS defines authentication but not token mechanics. |
| 2 | Exact meaning and storage mapping of “Employee ID” | SRS allows Employee ID or Employee Code; ERD shows `employee_code` on `ORGANIZATION_ACCOUNT` but no separate employee-number field on `EMPLOYEE`. |
| 3 | Initial organization status after creation | SRS lists lifecycle statuses but does not explicitly state the default. |
| 4 | Organization status transition matrix and approval flow | SRS says transitions require approval but does not define the workflow. |
| 5 | Whether `organization_code` can be changed after creation | SRS requires uniqueness but does not state immutability. |
| 6 | Exact platform and organization permission catalogue | SRS requires RBAC; ERD defines permission entities but not the complete code list or grants. |
| 7 | Role assignment authority and scope rules | ERD supports branch/department-scoped assignments; the final role-permission matrix is a dependency. |
| 8 | Branch contact fields | SRS mentions branch contact details; the selected ERD branch entity does not show contact fields. |
| 9 | Code uniqueness scope for branch, department, and position | ERD does not show explicit unique constraints for these codes. |
| 10 | Whether organization/branch/department/position records are deactivated or physically deleted | SRS uses deactivate language and requires reference integrity; final lifecycle rules should be explicit. |
| 11 | Whether Phase 1 includes organization account provisioning | The selected ERD includes organization accounts, but the Phase 1 tracker does not list employee onboarding/account creation as a deliverable. |
| 12 | Exact page-size limits, sortable fields, and search matching behaviour | SRS requires list capabilities but does not define technical limits. |

---

## 17. Source traceability

| Contract area | Source |
|---|---|
| Phase 0 and Phase 1 task boundaries | HRGo Development Plan — Task Plan & Tracker screenshot supplied with this request. |
| Product roles and separate authentication contexts | HRGo SRS v3.0, Sections 3.2–3.4. |
| Platform authentication and platform user/RBAC requirements | HRGo SRS v3.0, Section 4.1.1 (`PLT-FR-001` to `PLT-FR-008`). |
| Organization profile, identifiers, lifecycle, search, pagination, and audit | HRGo SRS v3.0, Section 4.1.2. |
| Branch requirements | HRGo SRS v3.0, Section 4.2.1 (`ORG-FR-001` to `ORG-FR-005`). |
| Department requirements | HRGo SRS v3.0, Section 4.2.2 (`ORG-FR-010` to `ORG-FR-014`). |
| Position requirements | HRGo SRS v3.0, Section 4.2.3 (`ORG-FR-020` to `ORG-FR-022`). |
| Tenant isolation and server-side permission principles | HRGo SRS v3.0, Sections 3.4, 6.2, and 7 (`NFR-001` to `NFR-006`). |
| Platform & Shared Permissions entities | HRGo Complete Logical ERD v1, area labelled **PLATFORM & SHARED PERMISSIONS** only. |
| Organization Structure & Identity entities | HRGo Complete Logical ERD v1, area labelled **ORGANIZATION STRUCTURE & IDENTITY** only. |

---

## 18. Change log

| Date | Author | Change |
|---|---|---|
| 2026-11-12 | LCN-Alvin | Initial Phase 0 and Phase 1 API contract draft. Limited ERD review to Platform & Shared Permissions and Organization Structure & Identity. |
| 2026-11-13 | LCN-Alvin | Added a consolidated API endpoint summary table grouped by Control, Workspace, and operational endpoints. |
| 2026-11-12 | LCN-Alvin | Simplified all API routes into `/api/v1/control/` for Platform Admin and `/api/v1/workspace/` for Organization and Employee APIs. |

---

**HRGo — Better Workplace Together**
