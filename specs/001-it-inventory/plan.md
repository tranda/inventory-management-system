# Implementation Plan: IT Inventory Management System

**Branch**: `001-it-inventory` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-it-inventory/spec.md`

## Summary

Build a web-based IT Inventory Management System for tracking company IT equipment, managing asset assignments to employees, and maintaining complete equipment history. The system uses a React/TypeScript frontend with Vite and Shadcn/ui, a Node.js/Express backend with Prisma ORM, PostgreSQL database, and Redis for email queuing. Fully containerized with Docker for deployment on Linux servers.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS for backend, Vite for frontend)
**Primary Dependencies**:
- Frontend: React 18, Vite, TanStack Query, React Router, Tailwind CSS, Shadcn/ui, React Hook Form, Zod, date-fns
- Backend: Express.js, Prisma, bcrypt, jsonwebtoken, Multer, Nodemailer, Bull, Helmet.js
- Infrastructure: Docker, Nginx, PostgreSQL 16, Redis 7

**Storage**: PostgreSQL 16 (primary), Redis 7 (session store, email queue), Docker volumes (uploads)
**Testing**: Vitest (frontend), Supertest (API integration), Playwright (E2E), 70% coverage target
**Target Platform**: Linux server (Ubuntu 22.04 LTS), Docker containers, modern browsers
**Project Type**: Web application (monorepo with frontend + backend + shared)
**Performance Goals**: 100 concurrent users, <2s search results, <30s report generation for 10k items
**Constraints**: 5MB max photo upload, HTTPS required in production, JWT 15min access / 7day refresh
**Scale/Scope**: 10,000 items, 100 concurrent users, 3 user roles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*Reference: [constitution.md](../../.specify/memory/constitution.md) v1.0.0*

| Article | Requirement | Status | Compliance Notes |
|---------|-------------|--------|------------------|
| **Art. 1** | TypeScript strict mode, no `any`, explicit return types | PASS | tsconfig.json strict: true, ESLint no-explicit-any rule |
| **Art. 1** | Feature-based folder structure, max 300 lines/file | PASS | Structure organized by feature (inventory, assignments, etc.) |
| **Art. 1** | Naming conventions (PascalCase, camelCase, snake_case) | PASS | Conventions documented in project structure |
| **Art. 2** | 70% coverage minimum, 100% for critical paths | PASS | Vitest + Supertest + Playwright, coverage threshold configured |
| **Art. 2** | Tests alongside source files | PASS | `Component.tsx` → `Component.test.tsx` pattern |
| **Art. 2** | No `it.skip()` in committed code | PASS | ESLint rule to enforce |
| **Art. 3** | Definition of Done protocol | PASS | Tasks.md + spec.md tracking, commit format defined |
| **Art. 4** | RESTful standards, consistent response format | PASS | OpenAPI contract defines `{success, data, meta}` format |
| **Art. 4** | Zod validation at API boundary | PASS | Zod schemas in shared/ and backend/validators/ |
| **Art. 5** | JWT 15min access + 7day refresh, HTTP-only cookies | PASS | Auth strategy matches constitution requirements |
| **Art. 5** | RBAC middleware, audit all auth failures | PASS | rbac.middleware.ts, audit.service.ts planned |
| **Art. 5** | Audit trail with before/after, IP, user agent | PASS | AuditLog entity includes all required fields |
| **Art. 6** | UUIDs, created_at/updated_at, soft deletes | PASS | Prisma schema uses UUIDs, timestamps, deletedAt |
| **Art. 6** | Prisma migrations, reversible when possible | PASS | Migrations managed via Prisma CLI |
| **Art. 7** | Custom error classes, error boundaries | PASS | error.middleware.ts (backend), ErrorBoundary (frontend) |
| **Art. 7** | No empty catch blocks | PASS | ESLint no-empty rule enforced |
| **Art. 8** | Multi-stage Docker builds, specific tags, non-root | PASS | Dockerfiles use alpine, multi-stage, USER node |
| **Art. 8** | .env.example, validate env at startup | PASS | Fail-fast validation in app.ts |
| **Art. 8** | CI/CD pipeline, full test suite before deploy | PASS | GitHub Actions workflow planned |
| **Art. 9** | OpenAPI docs, ADR format for decisions | PASS | contracts/openapi.yaml, docs/decisions/ planned |
| **Art. 10** | YAGNI, minimal dependencies, no premature optimization | PASS | Standard libraries only, no exotic patterns |

## Project Structure

### Documentation (this feature)

```text
specs/001-it-inventory/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/      # Reusable UI components (Shadcn/ui based)
│   │   ├── ui/          # Base Shadcn components
│   │   ├── forms/       # Form components (ItemForm, AssignmentForm, etc.)
│   │   ├── tables/      # Data table components
│   │   └── layout/      # Layout components (Header, Sidebar, etc.)
│   ├── pages/           # Route pages
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── assignments/
│   │   ├── employees/
│   │   ├── reports/
│   │   ├── audit/
│   │   └── auth/
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client services (TanStack Query)
│   ├── lib/             # Utilities (date formatting, validators)
│   └── types/           # TypeScript types (shared with backend)
├── tests/
│   ├── unit/            # Component unit tests (Vitest)
│   └── e2e/             # Playwright E2E tests
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json

backend/
├── src/
│   ├── controllers/     # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── items.controller.ts
│   │   ├── assignments.controller.ts
│   │   ├── employees.controller.ts
│   │   ├── reports.controller.ts
│   │   └── audit.controller.ts
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   ├── items.service.ts
│   │   ├── assignments.service.ts
│   │   ├── email.service.ts
│   │   └── audit.service.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/          # Route definitions
│   ├── validators/      # Request validation schemas (Zod)
│   ├── utils/           # Utilities (thumbnail generation, etc.)
│   ├── jobs/            # Bull queue jobs (email sending)
│   ├── prisma/          # Prisma schema and migrations
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── types/           # TypeScript types
│   └── app.ts           # Express app setup
├── tests/
│   ├── unit/            # Service unit tests
│   └── integration/     # API integration tests (Supertest)
├── tsconfig.json
└── package.json

shared/
├── types/               # Shared TypeScript interfaces
│   ├── item.types.ts
│   ├── assignment.types.ts
│   ├── employee.types.ts
│   ├── user.types.ts
│   └── api.types.ts
├── constants/           # Shared constants (statuses, categories)
│   ├── item-status.ts
│   ├── item-category.ts
│   └── user-roles.ts
├── validators/          # Shared Zod schemas
└── package.json

docker/
├── frontend/
│   └── Dockerfile       # Multi-stage: Node build → Nginx serve
├── backend/
│   └── Dockerfile       # Node 20 Alpine
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
└── scripts/
    ├── backup.sh
    └── restore.sh

nginx/
├── nginx.conf           # Main Nginx config
└── conf.d/
    └── default.conf     # Site config with SSL, proxy rules

docker-compose.yml           # Development
docker-compose.prod.yml      # Production
.env.example                 # Environment template
```

**Structure Decision**: Web application monorepo pattern selected. Frontend and backend are separate projects for independent deployment and scaling, with shared types package for type safety across the stack.

## Complexity Tracking

> No constitution violations requiring justification. Architecture is proportional to requirements.
