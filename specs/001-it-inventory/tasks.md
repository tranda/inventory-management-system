# Tasks: IT Inventory Management System

**Input**: Design documents from `/specs/001-it-inventory/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution Article 2 (70% coverage minimum).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Docker setup, and basic structure

- [x] T001 Create monorepo structure per plan.md: `frontend/`, `backend/`, `shared/`, `docker/`, `nginx/`
- [x] T002 [P] Initialize frontend project: `npm create vite@latest frontend -- --template react-ts`
- [x] T003 [P] Initialize backend project: `npm init` in `backend/` with TypeScript configuration
- [x] T004 [P] Initialize shared package: `npm init` in `shared/` with TypeScript configuration
- [x] T005 Configure TypeScript strict mode in all packages (`tsconfig.json` with `strict: true`, `noImplicitAny: true`)
- [x] T006 [P] Install frontend dependencies: React 18, TanStack Query, React Router, Tailwind CSS, Shadcn/ui, React Hook Form, Zod, date-fns
- [x] T007 [P] Install backend dependencies: Express.js, Prisma, bcrypt, jsonwebtoken, Multer, Nodemailer, Bull, Helmet.js
- [x] T008 [P] Configure ESLint + Prettier for frontend in `frontend/.eslintrc.js`
- [x] T009 [P] Configure ESLint + Prettier for backend in `backend/.eslintrc.js`
- [x] T010 [P] Create Dockerfile for frontend in `docker/frontend/Dockerfile` (multi-stage: Node build → Nginx serve)
- [x] T011 [P] Create Dockerfile for backend in `docker/backend/Dockerfile` (Node 20 Alpine, non-root user)
- [x] T012 Create `docker-compose.yml` with services: postgres, redis, backend, frontend, nginx
- [x] T013 [P] Create `docker-compose.prod.yml` for production deployment
- [x] T014 Create `.env.example` with all required environment variables
- [x] T015 [P] Create Nginx configuration in `nginx/conf.d/default.conf` with reverse proxy rules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema

- [x] T016 Create Prisma schema in `backend/prisma/schema.prisma` with all enums (UserRole, ItemCategory, ItemStatus, ItemCondition) and configure `schema` path in package.json prisma config <!-- 2025-12-06 -->
- [x] T017 Add User model to Prisma schema with UUID, email, passwordHash, firstName, lastName, role, isActive, timestamps <!-- 2025-12-06 -->
- [x] T018 Add Item model to Prisma schema with all fields per data-model.md (assetId, name, category, status, condition, etc.) <!-- 2025-12-06 -->
- [x] T019 Add Employee model to Prisma schema with UUID, email, firstName, lastName, department, title, phone, isActive, timestamps <!-- 2025-12-06 -->
- [x] T020 Add Assignment model to Prisma schema with all relations and fields per data-model.md <!-- 2025-12-06 -->
- [x] T021 Add AuditLog model to Prisma schema per Constitution Art. 5.4 (metadata with ipAddress, userAgent) <!-- 2025-12-06 -->
- [x] T022 Add indexes to Prisma schema per data-model.md (composite indexes for performance) <!-- 2025-12-06 -->
- [x] T023 Run `prisma migrate dev` to generate initial migration (used prisma db push for Prisma 7) <!-- 2025-12-06 -->
- [x] T024 Create seed script in `backend/prisma/seed.ts` with admin user and sample data <!-- 2025-12-06 -->

### Shared Types & Constants

- [x] T025 [P] Create shared types in `shared/src/types/item.types.ts` (Item, ItemCategory, ItemStatus, ItemCondition) <!-- 2025-12-06 -->
- [x] T026 [P] Create shared types in `shared/src/types/user.types.ts` (User, UserRole) <!-- 2025-12-06 -->
- [x] T027 [P] Create shared types in `shared/src/types/employee.types.ts` (Employee) <!-- 2025-12-06 -->
- [x] T028 [P] Create shared types in `shared/src/types/assignment.types.ts` (Assignment, AssignmentCreate, AssignmentReturn) <!-- 2025-12-06 -->
- [x] T029 [P] Create shared types in `shared/src/types/api.types.ts` (ApiResponse, Meta, Error per Constitution Art. 4.2) <!-- 2025-12-06 -->
- [x] T030 [P] Create constants in `shared/src/constants/item-status.ts` <!-- 2025-12-06 -->
- [x] T031 [P] Create constants in `shared/src/constants/item-category.ts` <!-- 2025-12-06 -->
- [x] T032 [P] Create constants in `shared/src/constants/user-roles.ts` <!-- 2025-12-06 -->

### Backend Core Infrastructure

- [x] T033 Create Express app setup in `backend/src/app.ts` with environment validation (fail-fast per Constitution Art. 8.2) <!-- 2025-12-06 -->
- [x] T034 Create error middleware in `backend/src/middleware/error.middleware.ts` with custom error classes per Constitution Art. 7.1 <!-- 2025-12-06 -->
- [x] T035 [P] Create validation middleware in `backend/src/middleware/validation.middleware.ts` using Zod <!-- 2025-12-06 -->
- [x] T036 Create auth middleware in `backend/src/middleware/auth.middleware.ts` (JWT verification, HTTP-only cookies per Constitution Art. 5.1) <!-- 2025-12-06 -->
- [x] T037 Create RBAC middleware in `backend/src/middleware/rbac.middleware.ts` with role checks per Constitution Art. 5.2 <!-- 2025-12-06 -->
- [x] T038 Create audit service in `backend/src/services/audit.service.ts` with before/after, IP, user agent capture per Constitution Art. 5.4 <!-- 2025-12-06 -->
- [x] T039 [P] Create base Zod validators in `backend/src/validators/common.validators.ts` (UUID, pagination, date ranges) <!-- 2025-12-06 -->

### Frontend Core Infrastructure

- [x] T040 Configure Tailwind CSS in `frontend/tailwind.config.js` <!-- 2025-12-06 -->
- [x] T041 Initialize Shadcn/ui in `frontend/` and add base components (Button, Input, Form, Table, Card, Dialog, Select) <!-- 2025-12-06 -->
- [x] T042 Create API client in `frontend/src/lib/api.ts` with TanStack Query configuration <!-- 2025-12-06 -->
- [x] T043 Create auth context in `frontend/src/contexts/AuthContext.tsx` with login/logout, role-based access <!-- 2025-12-06 -->
- [x] T044 Create layout components in `frontend/src/components/layout/` (Header, Sidebar, MainLayout) <!-- 2025-12-06 -->
- [x] T045 Create error boundary in `frontend/src/components/ErrorBoundary.tsx` per Constitution Art. 7.3 <!-- 2025-12-06 -->
- [x] T046 Create React Router setup in `frontend/src/App.tsx` with protected routes <!-- 2025-12-06 -->

### Authentication Implementation

- [x] T047 Create auth validators in `backend/src/validators/auth.validators.ts` (login, register schemas) <!-- 2025-12-06 -->
- [x] T048 Create auth service in `backend/src/services/auth.service.ts` (login, register, refresh, logout) <!-- 2025-12-06 -->
- [x] T049 Create auth controller in `backend/src/routes/auth.routes.ts` (inline) with JWT 15min access / 7day refresh per Constitution Art. 5.1 <!-- 2025-12-06 -->
- [x] T050 Create auth routes in `backend/src/routes/auth.routes.ts` (POST /auth/login, POST /auth/logout, POST /auth/refresh) <!-- 2025-12-06 -->
- [x] T051 Create login page in `frontend/src/pages/LoginPage.tsx` <!-- 2025-12-06 -->
- [x] T052 Integrate auth hooks with API in `frontend/src/services/auth.service.ts` <!-- 2025-12-06 -->

### Testing Infrastructure

- [x] T053 [P] Configure Vitest in `frontend/vitest.config.ts` with coverage threshold (70%) <!-- 2025-12-06 -->
- [x] T054 [P] Configure Supertest in `backend/` for API integration tests (already installed) <!-- 2025-12-06 -->
- [x] T055 [P] Configure Playwright in `frontend/tests/e2e/` for end-to-end tests <!-- 2025-12-06 -->
- [x] T056 Create test utilities in `backend/tests/helpers/` (test database setup, mock auth middleware, entity factories for User, Item, Employee, Assignment) <!-- 2025-12-06 -->

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add New Equipment to Inventory (Priority: P1) 🎯 MVP

**Goal**: IT administrators can add new equipment to the inventory system with all required and optional fields.

**Independent Test**: Add a single piece of equipment with all required details and verify it appears in the inventory list with correct information.

### Tests for User Story 1

- [ ] T057 [P] [US1] Create contract tests for POST /items in `backend/tests/integration/items.create.test.ts`
- [ ] T058 [P] [US1] Create unit tests for item service in `backend/tests/unit/items.service.test.ts`

### Implementation for User Story 1

- [x] T059 [US1] Create item validators in `backend/src/validators/item.validators.ts` (create, update schemas with Zod) <!-- 2025-12-06 -->
- [x] T060 [US1] Create item service in `backend/src/services/items.service.ts` (create, findById, generateAssetId) <!-- 2025-12-06 -->
- [x] T061 [US1] Create photo upload utility in `backend/src/utils/upload.ts` (Multer config, thumbnail generation) <!-- 2025-12-06 -->
- [x] T062 [US1] Create items controller in `backend/src/controllers/items.controller.ts` (POST /items with photo upload) <!-- 2025-12-06 -->
- [x] T063 [US1] Create items routes in `backend/src/routes/items.routes.ts` <!-- 2025-12-06 -->
- [x] T064 [US1] Integrate audit logging for item creation in items.service.ts <!-- 2025-12-06 -->
- [x] T065 [P] [US1] Create ItemForm component in `frontend/src/components/forms/ItemForm.tsx` with React Hook Form + Zod <!-- 2025-12-06 -->
- [x] T066 [P] [US1] Create item service hooks in `frontend/src/services/items.service.ts` (useCreateItem mutation) <!-- 2025-12-06 -->
- [x] T067 [US1] Create AddItemPage in `frontend/src/pages/inventory/AddItemPage.tsx` <!-- 2025-12-06 -->
- [x] T068 [US1] Add photo upload component in `frontend/src/components/forms/PhotoUpload.tsx` <!-- 2025-12-06 -->

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Assign Equipment to Employee (Priority: P1) 🎯 MVP

**Goal**: IT administrators can assign available equipment to employees with full tracking.

**Independent Test**: Select an available item, assign it to an employee, verify status changes to "Assigned" and appears in employee's list.

### Tests for User Story 2

- [ ] T069 [P] [US2] Create contract tests for POST /assignments in `backend/tests/integration/assignments.create.test.ts`
- [ ] T070 [P] [US2] Create unit tests for assignment service in `backend/tests/unit/assignments.service.test.ts`

### Implementation for User Story 2

- [x] T071 [US2] Create employee validators in `backend/src/validators/employee.validators.ts` <!-- 2025-12-06 -->
- [x] T072 [US2] Create employee service in `backend/src/services/employees.service.ts` (findAll, findById, search) <!-- 2025-12-06 -->
- [x] T073 [US2] Create employees controller in `backend/src/routes/employees.routes.ts` (inline) (GET /employees, GET /employees/:id) <!-- 2025-12-06 -->
- [x] T074 [US2] Create employees routes in `backend/src/routes/employees.routes.ts` <!-- 2025-12-06 -->
- [x] T075 [US2] Create assignment validators in `backend/src/validators/assignment.validators.ts` <!-- 2025-12-06 -->
- [x] T076 [US2] Create assignment service in `backend/src/services/assignments.service.ts` (create, validateItemAvailable) <!-- 2025-12-06 -->
- [x] T077 [US2] Create assignments controller in `backend/src/routes/assignments.routes.ts` (inline) (POST /assignments) <!-- 2025-12-06 -->
- [x] T078 [US2] Create assignments routes in `backend/src/routes/assignments.routes.ts` <!-- 2025-12-06 -->
- [x] T079 [US2] Update item status to ASSIGNED in assignment.service.create() with transaction <!-- 2025-12-06 -->
- [x] T080 [US2] Integrate audit logging for assignments in assignments.service.ts <!-- 2025-12-06 -->
- [x] T081 [P] [US2] Create EmployeeSelect component in `frontend/src/components/forms/EmployeeSelect.tsx` <!-- 2025-12-06 -->
- [x] T082 [P] [US2] Create AssignmentForm component in `frontend/src/components/forms/AssignmentForm.tsx` (include acknowledged checkbox per FR-015) <!-- 2025-12-06 -->
- [x] T083 [US2] Create employee service hooks in `frontend/src/services/employees.service.ts` <!-- 2025-12-06 -->
- [x] T084 [US2] Create assignment service hooks in `frontend/src/services/assignments.service.ts` (useCreateAssignment) <!-- 2025-12-06 -->
- [x] T085 [US2] Create AssignItemPage in `frontend/src/pages/assignments/AssignItemPage.tsx` <!-- 2025-12-06 -->

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Return Equipment (Priority: P1) 🎯 MVP

**Goal**: IT administrators can process equipment returns with condition assessment and proper status updates.

**Independent Test**: Process a return for an assigned item, verify it becomes available in the inventory.

### Tests for User Story 3

- [ ] T086 [P] [US3] Create contract tests for PUT /assignments/:id/return in `backend/tests/integration/assignments.return.test.ts`
- [ ] T087 [P] [US3] Create unit tests for return logic in `backend/tests/unit/assignments.return.test.ts`

### Implementation for User Story 3

- [x] T088 [US3] Add return validators in `backend/src/validators/assignment.validators.ts` (return schema) <!-- 2025-12-06 -->
- [x] T089 [US3] Add processReturn method in `backend/src/services/assignments.service.ts` with status logic <!-- 2025-12-06 -->
- [x] T090 [US3] Add return endpoint in assignments controller: PUT /assignments/:id/return <!-- 2025-12-06 -->
- [x] T091 [US3] Implement automatic status transition: ASSIGNED → AVAILABLE or IN_REPAIR based on condition <!-- 2025-12-06 -->
- [x] T092 [US3] Integrate audit logging for returns <!-- 2025-12-06 -->
- [x] T093 [P] [US3] Create ReturnForm component in `frontend/src/components/forms/ReturnForm.tsx` <!-- 2025-12-06 -->
- [x] T094 [US3] Add useReturnAssignment mutation in `frontend/src/services/assignments.service.ts` <!-- 2025-12-06 -->
- [x] T095 [US3] Create ReturnItemPage in `frontend/src/pages/assignments/ReturnItemPage.tsx` <!-- 2025-12-06 -->

**Checkpoint**: Core P1 MVP complete - add, assign, and return equipment all functional

---

## Phase 6: User Story 4 - View and Search Inventory (Priority: P2)

**Goal**: IT administrators can view, search, and filter the complete inventory with export capability.

**Independent Test**: Populate inventory with test items and verify they can be found via search and filters.

### Tests for User Story 4

- [ ] T096 [P] [US4] Create contract tests for GET /items in `backend/tests/integration/items.list.test.ts`
- [ ] T097 [P] [US4] Create E2E test for inventory search in `frontend/tests/e2e/inventory-search.spec.ts`

### Implementation for User Story 4

- [x] T098 [US4] Add list/search methods in `backend/src/services/items.service.ts` (findAll, search with full-text) <!-- 2025-12-06 -->
- [x] T099 [US4] Add list endpoint in items controller: GET /items with pagination, filtering, search <!-- 2025-12-06 -->
- [x] T100 [US4] Add export endpoint in items controller: GET /items/export (CSV, Excel) <!-- 2025-12-06 -->
- [x] T101 [P] [US4] Create DataTable component in `frontend/src/components/tables/DataTable.tsx` with sorting, pagination <!-- 2025-12-06 -->
- [x] T102 [P] [US4] Create ItemFilters component in `frontend/src/components/inventory/ItemFilters.tsx` <!-- 2025-12-06 -->
- [x] T103 [US4] Add useItems query hook in `frontend/src/services/items.service.ts` <!-- 2025-12-06 -->
- [x] T104 [US4] Create InventoryListPage in `frontend/src/pages/inventory/InventoryListPage.tsx` with list/grid toggle <!-- 2025-12-06 -->
- [x] T104a [P] [US4] Create ItemGridView component in `frontend/src/components/inventory/ItemGridView.tsx` for card-based display (FR-010) <!-- 2025-12-06 -->
- [x] T105 [US4] Add export functionality in InventoryListPage (CSV download) <!-- 2025-12-06 -->
- [x] T105a [US4] Add bulk delete endpoint in items controller: DELETE /items/bulk with array of IDs (FR-009, ADMIN only) <!-- 2025-12-06 -->
- [x] T105b [US4] Add bulk delete service method in `backend/src/services/items.service.ts` (skip assigned items, return skipped IDs) <!-- 2025-12-06 -->
- [x] T105c [US4] Add BulkDeleteDialog component in `frontend/src/components/inventory/BulkDeleteDialog.tsx` with confirmation and results <!-- 2025-12-06 -->

**Checkpoint**: User Story 4 complete - inventory viewing and search functional

---

## Phase 7: User Story 5 - View Item History and Timeline (Priority: P2)

**Goal**: Users can see the complete history and timeline of any item in the inventory.

**Independent Test**: View an item that has been assigned and returned multiple times, verify complete timeline is displayed.

### Tests for User Story 5

- [ ] T106 [P] [US5] Create contract tests for GET /items/:id/history in `backend/tests/integration/items.history.test.ts`

### Implementation for User Story 5

- [x] T107 [US5] Add getHistory method in `backend/src/services/items.service.ts` <!-- 2025-12-06 -->
- [x] T108 [US5] Add history endpoint in items controller: GET /items/:id/history <!-- 2025-12-06 -->
- [x] T109 [P] [US5] Create ItemTimeline component in `frontend/src/components/inventory/ItemTimeline.tsx` <!-- 2025-12-06 -->
- [x] T110 [US5] Add useItemHistory query hook in `frontend/src/services/items.service.ts` <!-- 2025-12-06 -->
- [x] T111 [US5] Create ItemDetailPage in `frontend/src/pages/inventory/ItemDetailPage.tsx` with history tab <!-- 2025-12-06 -->

**Checkpoint**: User Story 5 complete - item history visible

---

## Phase 8: User Story 6 - View Employee Equipment (Priority: P2)

**Goal**: Managers and IT admins can see all equipment assigned to an employee (current and historical).

**Independent Test**: Navigate to an employee's profile and verify current and historical assignments are displayed.

### Tests for User Story 6

- [ ] T112 [P] [US6] Create contract tests for GET /employees/:id/assignments in `backend/tests/integration/employees.assignments.test.ts`

### Implementation for User Story 6

- [x] T113 [US6] Add getAssignments method in `backend/src/services/employees.service.ts` <!-- 2025-12-06 -->
- [x] T114 [US6] Add employee assignments endpoint: GET /employees/:id/assignments <!-- 2025-12-06 -->
- [x] T115 [P] [US6] Create EmployeeEquipmentList component in `frontend/src/components/employees/EmployeeEquipmentList.tsx` <!-- 2025-12-06 -->
- [x] T116 [US6] Add useEmployeeAssignments query hook in `frontend/src/services/employees.service.ts` <!-- 2025-12-06 -->
- [x] T117 [US6] Create EmployeeDetailPage in `frontend/src/pages/employees/EmployeeDetailPage.tsx` <!-- 2025-12-06 -->
- [x] T118 [US6] Create EmployeesListPage in `frontend/src/pages/employees/EmployeeListPage.tsx` <!-- 2025-12-06 -->
- [x] T118a [US6] Add deactivateEmployee method in `backend/src/services/employees.service.ts` (flag equipment for review when employee deactivated per edge case) <!-- 2025-12-06 -->
- [x] T118b [US6] Add deactivate endpoint in employees controller: PUT /employees/:id/deactivate (show warning if equipment assigned) <!-- 2025-12-06 -->

**Checkpoint**: User Story 6 complete - employee equipment view functional

---

## Phase 9: User Story 7 - Dashboard and Overview (Priority: P2)

**Goal**: Users see a dashboard with inventory status at a glance including counts, due soon, and warnings.

**Independent Test**: Load the dashboard and verify all metrics accurately reflect the current inventory state.

### Tests for User Story 7

- [ ] T119 [P] [US7] Create contract tests for GET /dashboard in `backend/tests/integration/dashboard.test.ts`

### Implementation for User Story 7

- [x] T120 [US7] Create dashboard service in `backend/src/services/dashboard.service.ts` (getCounts, getDueSoon, getExpiredWarranties) <!-- 2025-12-06 -->
- [x] T121 [US7] Create dashboard controller (inline in `backend/src/routes/dashboard.routes.ts`) <!-- 2025-12-06 -->
- [x] T122 [US7] Create dashboard routes in `backend/src/routes/dashboard.routes.ts` <!-- 2025-12-06 -->
- [x] T123 [P] [US7] Create StatCard component in `frontend/src/components/dashboard/StatCard.tsx` <!-- 2025-12-06 -->
- [x] T124 [P] [US7] Create DueSoonList component in `frontend/src/components/dashboard/DueSoonList.tsx` <!-- 2025-12-06 -->
- [x] T125 [P] [US7] Create WarrantyAlerts component in `frontend/src/components/dashboard/WarrantyAlerts.tsx` <!-- 2025-12-06 -->
- [x] T126 [P] [US7] Create RecentActivity component in `frontend/src/components/dashboard/RecentActivity.tsx` (fetch recent entries from audit log service per FR-030) <!-- 2025-12-06 -->
- [x] T127 [US7] Add useDashboard query hook in `frontend/src/services/dashboard.service.ts` <!-- 2025-12-06 -->
- [x] T128 [US7] Create DashboardPage in `frontend/src/pages/DashboardPage.tsx` <!-- 2025-12-06 -->

**Checkpoint**: All P2 user stories complete

---

## Phase 10: User Story 8 - Transfer Equipment Between Employees (Priority: P3)

**Goal**: IT administrators can transfer equipment directly between employees without full return/assign cycle.

**Independent Test**: Transfer an item from one employee to another and verify both records are updated.

### Tests for User Story 8

- [ ] T129 [P] [US8] Create contract tests for POST /assignments/:id/transfer in `backend/tests/integration/assignments.transfer.test.ts`

### Implementation for User Story 8

- [x] T130 [US8] Add transfer validators in `backend/src/validators/assignment.validators.ts` <!-- 2025-12-06 -->
- [x] T131 [US8] Add transferAssignment method in `backend/src/services/assignments.service.ts` <!-- 2025-12-06 -->
- [x] T132 [US8] Add transfer endpoint in assignments controller: POST /assignments/:id/transfer <!-- 2025-12-06 -->
- [x] T133 [P] [US8] Create TransferForm component in `frontend/src/components/forms/TransferForm.tsx` <!-- 2025-12-06 -->
- [x] T134 [US8] Add useTransferAssignment mutation in `frontend/src/services/assignments.service.ts` <!-- 2025-12-06 -->
- [x] T135 [US8] Create TransferPage in `frontend/src/pages/assignments/TransferPage.tsx` <!-- 2025-12-06 -->

**Checkpoint**: User Story 8 complete - transfer functionality available

---

## Phase 11: User Story 9 - Generate Reports (Priority: P3)

**Goal**: Managers can generate and export various inventory and assignment reports.

**Independent Test**: Generate each report type and verify the data matches the system records.

### Tests for User Story 9

- [ ] T136 [P] [US9] Create contract tests for GET /reports/* in `backend/tests/integration/reports.test.ts`

### Implementation for User Story 9

- [x] T137 [US9] Create reports service in `backend/src/services/reports.service.ts` (inventorySummary, assignmentHistory, equipmentByEmployee, warrantyStatus, depreciationReport with annual rate calculation per FR-033) <!-- 2025-12-06 -->
- [x] T138 [US9] Create reports controller (inline in `backend/src/routes/reports.routes.ts`) <!-- 2025-12-06 -->
- [x] T139 [US9] Create reports routes in `backend/src/routes/reports.routes.ts` <!-- 2025-12-06 -->
- [x] T140 [US9] Add export functionality (CSV, Excel) in reports service (convertToCSV in `backend/src/services/reports.service.ts`) <!-- 2025-12-06 -->
- [x] T141 [P] [US9] Create ReportFilters component in `frontend/src/components/reports/ReportFilters.tsx` <!-- 2025-12-06 -->
- [x] T142 [P] [US9] Create ReportViewer component in `frontend/src/components/reports/ReportViewer.tsx` <!-- 2025-12-06 -->
- [x] T143 [US9] Add useReports query hooks in `frontend/src/services/reports.service.ts` <!-- 2025-12-06 -->
- [x] T144 [US9] Create ReportsPage in `frontend/src/pages/reports/ReportsPage.tsx` with report type selection <!-- 2025-12-06 -->

**Checkpoint**: User Story 9 complete - reporting available

---

## Phase 12: User Story 10 - Manage Item Status (Priority: P3)

**Goal**: IT administrators can manually change item status with required reason tracking.

**Independent Test**: Change an item's status and provide a reason, verify the change is recorded.

### Tests for User Story 10

- [ ] T145 [P] [US10] Create contract tests for PUT /items/:id/status in `backend/tests/integration/items.status.test.ts`

### Implementation for User Story 10

- [x] T146 [US10] Add status change validators in `backend/src/validators/item.validators.ts` (require reason) <!-- 2025-12-06 -->
- [x] T147 [US10] Add changeStatus method in `backend/src/services/items.service.ts` with validation for transitions <!-- 2025-12-06 -->
- [x] T148 [US10] Add status endpoint in items controller: PUT /items/:id/status <!-- 2025-12-06 -->
- [x] T149 [P] [US10] Create StatusChangeForm component in `frontend/src/components/forms/StatusChangeForm.tsx` <!-- 2025-12-06 -->
- [x] T150 [US10] Add useChangeItemStatus mutation in `frontend/src/services/items.service.ts` <!-- 2025-12-06 -->
- [x] T151 [US10] Integrate status change dialog in ItemDetailPage <!-- 2025-12-06 -->

**Checkpoint**: User Story 10 complete - manual status management available

---

## Phase 13: User Story 11 - Email Notifications (Priority: P3)

**Goal**: System sends email notifications for assignments, reminders, and alerts.

**Independent Test**: Trigger each notification type and verify emails are sent with correct content.

### Tests for User Story 11

- [ ] T152 [P] [US11] Create unit tests for email service in `backend/tests/unit/email.service.test.ts` (mock SMTP)

### Implementation for User Story 11

- [x] T153 [US11] Create email service in `backend/src/services/email.service.ts` with Nodemailer <!-- 2025-12-06 -->
- [x] T154 [US11] Create Bull queue for emails in `backend/src/jobs/email.queue.ts` <!-- 2025-12-06 -->
- [x] T155 [US11] Create email processor in `backend/src/jobs/email.processor.ts` <!-- 2025-12-06 -->
- [x] T156 [US11] Create email templates (inline in `backend/src/services/email.service.ts`) <!-- 2025-12-06 -->
- [x] T157 [US11] Integrate assignment notification in assignments routes (inline) <!-- 2025-12-06 -->
- [x] T158 [US11] Create scheduled job for return reminders in `backend/src/jobs/reminders.job.ts` (upcoming returns 3 days before AND overdue returns per FR-035/FR-036) <!-- 2025-12-06 -->
- [x] T159 [US11] Create scheduled job for warranty alerts in `backend/src/jobs/warranty-alerts.job.ts` <!-- 2025-12-06 -->
- [x] T159a [US11] Add `isConsumable` boolean and `minStockLevel` integer fields to Item model (already in schema) <!-- 2025-12-06 -->
- [x] T159b [US11] Create scheduled job for low stock alerts in `backend/src/jobs/low-stock-alerts.job.ts` <!-- 2025-12-06 -->
- [x] T159c [US11] Add low-stock email template (inline in `backend/src/services/email.service.ts`) <!-- 2025-12-06 -->

**Checkpoint**: User Story 11 complete - notifications functional

---

## Phase 14: User Story 12 - User Access Control (Priority: P3)

**Goal**: System administrator can manage user roles with proper access restrictions.

**Independent Test**: Log in as each role type and verify access to features matches the defined permissions.

### Tests for User Story 12

- [ ] T160 [P] [US12] Create contract tests for user management in `backend/tests/integration/users.test.ts`
- [ ] T161 [P] [US12] Create RBAC tests in `backend/tests/integration/rbac.test.ts`

### Implementation for User Story 12

- [x] T162 [US12] Create user validators in `backend/src/validators/user.validators.ts` <!-- 2025-12-06 -->
- [x] T163 [US12] Create user service in `backend/src/services/users.service.ts` (create, update, deactivate) <!-- 2025-12-06 -->
- [x] T164 [US12] Create users controller (inline in `backend/src/routes/users.routes.ts`, ADMIN only) <!-- 2025-12-06 -->
- [x] T165 [US12] Create users routes in `backend/src/routes/users.routes.ts` <!-- 2025-12-06 -->
- [x] T166 [P] [US12] Create UserForm component in `frontend/src/components/forms/UserForm.tsx` <!-- 2025-12-06 -->
- [x] T167 [P] [US12] Create UsersTable component in `frontend/src/components/tables/UsersTable.tsx` <!-- 2025-12-06 -->
- [x] T168 [US12] Add useUsers query hooks in `frontend/src/services/users.service.ts` <!-- 2025-12-06 -->
- [x] T169 [US12] Create UserManagementPage in `frontend/src/pages/admin/UserManagementPage.tsx` <!-- 2025-12-06 -->
- [x] T170 [US12] Implement role-based UI hiding throughout frontend (hide admin features from non-admins) <!-- 2025-12-06 -->

**Checkpoint**: All user stories complete

---

## Phase 15: Audit Log Viewer

**Purpose**: View and search audit logs per Constitution Art. 5.4

### Tests for Audit Log Viewer

- [ ] T170a [P] Create contract tests for GET /audit-logs in `backend/tests/integration/audit.test.ts`

### Implementation for Audit Log Viewer

- [x] T171 Create audit log query methods in `backend/src/services/audit.service.ts` (findAll with filters) <!-- 2025-12-06 -->
- [x] T172 Create audit controller (inline in `backend/src/routes/audit.routes.ts`) <!-- 2025-12-06 -->
- [x] T173 Create audit routes in `backend/src/routes/audit.routes.ts` (GET /audit-logs, ADMIN only) <!-- 2025-12-06 -->
- [x] T174 [P] Create AuditLogTable component in `frontend/src/components/tables/AuditLogTable.tsx` <!-- 2025-12-06 -->
- [x] T175 Add useAuditLogs query hook in `frontend/src/services/audit.service.ts` <!-- 2025-12-06 -->
- [x] T176 Create AuditLogPage in `frontend/src/pages/audit/AuditLogPage.tsx` with search and filters <!-- 2025-12-06 -->

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T177 [P] Add loading states and skeletons throughout frontend <!-- 2025-12-06 -->
- [x] T178 [P] Add toast notifications for success/error feedback <!-- 2025-12-06 -->
- [x] T179 [P] Add confirmation dialogs for destructive actions <!-- 2025-12-06 -->
- [ ] T180 Run ESLint and fix all warnings across codebase
- [ ] T181 [P] Run Prettier format across all files
- [ ] T182 Verify all API responses follow `{success, data, meta}` format per Constitution Art. 4.2
- [ ] T183 Run full test suite and verify 70% coverage per Constitution Art. 2.1
- [ ] T184 [P] Create backup script in `docker/scripts/backup.sh`
- [ ] T185 [P] Create restore script in `docker/scripts/restore.sh`
- [ ] T186 Run quickstart.md validation (verify all steps work)
- [ ] T187 Security hardening review per OWASP top 10

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-14)**: All depend on Foundational phase completion
  - P1 stories (US1-3) should complete first as they form MVP
  - P2 stories (US4-7) can proceed after P1
  - P3 stories (US8-12) can proceed after P2 or in parallel if resources allow
- **Audit Log Viewer (Phase 15)**: Depends on Foundational
- **Polish (Phase 16)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Uses Employee model but independently testable
- **User Story 3 (P1)**: Should follow US2 for full test scenario (needs assigned items to return)
- **User Story 4 (P2)**: Can start after Foundational - List/search independent of assignments
- **User Story 5 (P2)**: Best after US1-3 complete (needs history data to display)
- **User Story 6 (P2)**: Can start after US2 (needs assignment data)
- **User Story 7 (P2)**: Can start after Foundational - Dashboard aggregates data
- **User Story 8 (P3)**: Depends on US2 (transfers require existing assignments)
- **User Story 9 (P3)**: Can start after Foundational - Reports are read-only
- **User Story 10 (P3)**: Can start after US1 (status changes require items)
- **User Story 11 (P3)**: Depends on US2 (notifications trigger on assignments)
- **User Story 12 (P3)**: Can start after Foundational - User management is independent

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Backend before frontend within each story
- Models/Services before Controllers/Routes
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, P1 stories (US1, US2) can start in parallel
- Tests for each user story marked [P] can run in parallel
- Frontend components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Add Equipment
4. Complete Phase 4: User Story 2 - Assign Equipment
5. Complete Phase 5: User Story 3 - Return Equipment
6. **STOP and VALIDATE**: Test all three stories independently
7. Deploy/demo MVP if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1-3 → Test independently → Deploy MVP (core inventory cycle!)
3. Add US4-7 → Test independently → Deploy (search, history, dashboard)
4. Add US8-12 → Test independently → Deploy (transfers, reports, notifications, admin)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All API responses must follow `{success, data, meta}` format (Constitution Art. 4.2)
- Audit logs require ipAddress and userAgent (Constitution Art. 5.4)
- 70% test coverage required (Constitution Art. 2.1)

---

## Task Summary

**Total Tasks**: 197
**Coverage**: 100% of functional requirements (FR-001 through FR-043)

| Phase | Task Range | Count |
|-------|------------|-------|
| Setup | T001-T015 | 15 |
| Foundational | T016-T056 | 41 |
| US1 Add Equipment | T057-T068 | 12 |
| US2 Assign Equipment | T069-T085 | 17 |
| US3 Return Equipment | T086-T095 | 10 |
| US4 View/Search | T096-T105c | 14 |
| US5 Item History | T106-T111 | 6 |
| US6 Employee Equipment | T112-T118b | 9 |
| US7 Dashboard | T119-T128 | 10 |
| US8 Transfer | T129-T135 | 7 |
| US9 Reports | T136-T144 | 9 |
| US10 Status Mgmt | T145-T151 | 7 |
| US11 Notifications | T152-T159c | 11 |
| US12 Access Control | T160-T170 | 11 |
| Audit Log Viewer | T170a-T176 | 7 |
| Polish | T177-T187 | 11 |
