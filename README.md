# HRGo

**HR and Payroll Management System for Myanmar Organizations**

![HR Go banner](images/Banner.png)

HRGo is a cloud-based HR management platform designed to help organizations manage their workforce, attendance, leave, overtime, and employee information through web and mobile applications.

## Repository Structure

| Path | Description | Status |
|---|---|---|
| [`backend/`](backend/) | Backend API (Go, Gin, GORM, PostgreSQL, Dockerfile, Docker Compose) | Scaffolded |
| [`docs/`](docs/) | Project rules and documentation (`docs/rules/`) | Active |
| [`images/`](images/) | Project images and branding assets | Active |
| [`.github/workflows/`](.github/workflows/) | Backend CI, GHCR image push, and Render deploy workflows | Active |
| `frontend/` | Web application (Vite, React, TypeScript) | Planned (not yet added) |
| `mobile/` | Employee mobile application (Expo, React Native) | Planned (not yet added) |

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Go
- Gin Web Framework
- GORM
- PostgreSQL
- RESTful API Architecture

### Development Tools

- Yarn
- npm
- Git
- ESLint
- Prettier

## Authentication

HRGo uses separate authentication contexts for platform administrators and organization users.

| User Type | Login Identifier | Authentication |
|---|---|---|
| Superadmin | Email | Email + Password |
| Platform Support | Email | Email + Password |
| Org Admin | Employee Code | CODE +Password |
| Org Support | Employee Code | CODE +Password |
| Branch Manager | Employee Code | CODE +Password |
| HR Manager | Employee Code | CODE +Password |
| HR Support | Employee Code | CODE +Password |
| Department Manager | Employee Code | CODE +Password |
| Employee | Employee Code | CODE +Password |

Platform administrator authentication is separate from organization and employee authentication.

## Repository Setup

### Prerequisites

Install the following tools before starting development:

- Node.js
- Yarn
- Go
- PostgreSQL
- Git
- Expo CLI (through `npx expo`)

## Web Application

The web application is built with React, TypeScript, and Vite.

### Installation

```bash
cd frontend

cp .env.example .env

yarn install
```

### Development

```bash
yarn dev
```

Vite's default development URL:

```text
http://localhost:5173
```

Configure the backend API URL in the frontend `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Available Commands

```bash
# Production build
yarn build

# Preview production build
yarn preview

# Lint
yarn lint

# Type checking
yarn typecheck

# Format
yarn format
```

### Adding shadcn/ui Components

```bash
yarn shadcn add <component>
```

## Mobile Application

The mobile application is built using Expo and React Native.

### Prerequisites

- Node.js
- Expo Go on a physical device, or
- Android Emulator / iOS Simulator

### Installation

```bash
cd mobile

npm install
```

### Development

```bash
npx expo start
```

From the Expo CLI, you can launch the application on Android, iOS, or the web preview.

For libraries that require native code, use an Expo development build instead of Expo Go.

```bash
npx expo run:android
```

```bash
npx expo run:ios
```

## Backend

The backend is developed using Go, Gin, GORM, and PostgreSQL.

The application follows a modular architecture, separating business logic, HTTP handling, database access, request validation, and API routing.

### Technology

| Component | Technology |
|---|---|
| Programming Language | Go |
| Web Framework | Gin |
| ORM | GORM |
| Database | PostgreSQL |
| API Style | RESTful API |
| Architecture | Modular Architecture |

### Project & Module Structure

The backend uses a Spring Boot–style separation between production code (`cmd/`, `internal/`) and tests (`test/unit/`, `test/integration/`):

```text
backend/
├── cmd/
│   └── server/                  # HTTP server entrypoint (main.go)
├── internal/
│   ├── bootstrap/               # Gin engine wiring, middleware chain, /health & /ready probes
│   ├── config/                  # Environment configuration loader
│   ├── database/                # PostgreSQL / GORM connection and ping helpers
│   ├── logging/                 # Structured log/slog logger setup
│   ├── middleware/              # Request ID, recovery, request logger, CORS, security headers, body limit
│   └── shared/
│       ├── errors/              # Transport-safe application error types
│       └── responses/           # Standard JSON response envelopes
├── test/
│   └── unit/                    # Unit tests mirroring internal/ (external *_test packages)
├── .env.example
├── docker-compose.yml
└── Dockerfile
```

When feature modules are added under `internal/modules/<module_name>/`, each module follows this package structure (only creating packages the module actually uses):

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

### Backend Responsibilities

- HTTP server lifecycle and graceful shutdown
- Request IDs, panic recovery, structured logging, CORS, security headers, and body size limits
- Environment configuration and PostgreSQL connection pooling
- Health (`/health`) and readiness (`/ready`) probes
- Standard JSON success/error response envelopes
- Feature modules (`internal/modules/*` — to be added per phase)

### Running the Backend

```bash
cd backend
cp .env.example .env

# Run locally
go run ./cmd/server

# Run unit tests
go test ./test/unit/...
```

Or run via Docker Compose from the `backend/` directory:

```bash
cd backend
docker compose up --build
```

## Development Guidelines

- Follow the established project architecture and naming conventions.
- Keep business logic inside service packages.
- Keep database operations inside repository packages.
- Use request and response structures for API communication.
- Validate incoming requests before processing.
- Enforce authentication and authorization on protected endpoints.
- Apply organization-level data isolation.
- Maintain consistent error handling and API responses.
- Record important administrative and HR operations in audit logs.
- Follow the existing formatting and linting conventions.

## Current Status

- **Backend:** Base Go + Gin server scaffold is in place (`cmd/server`, `internal/bootstrap`, `internal/config`, `internal/database`, `internal/logging`, `internal/middleware`, `internal/shared/errors`, `internal/shared/responses`), along with unit tests under `backend/test/unit/`, `backend/Dockerfile`, `backend/docker-compose.yml`, and backend CI/CD workflows (`.github/workflows/`). Feature modules (`internal/modules/*`) and database migrations are not implemented yet.
- **Rules & Docs:** Coding, documentation, and localization rules are stored in `.cursor/rules/` and `docs/rules/`.
- **Web & Mobile:** `frontend/` and `mobile/` have not been initialized in this repository yet.

---

**HRGo — Better Workplace Together**

## Changed Logs

| Date | Time | Author | Change |
|---|---|---|---|
| 2026-11-12 | 11:18 | thanthtooaung-coding | Updated README structure, backend scaffold details, and reset change logs with the Time column. |