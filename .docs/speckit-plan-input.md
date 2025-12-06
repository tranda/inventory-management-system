# Spec Kit Input for /speckit.plan Command

## How to Use

Run this prompt with the `/speckit.plan` command after completing `/speckit.specify` and `/speckit.clarify`.

---

## /speckit.plan Prompt

```
/speckit.plan

The application will be built as a modern web application with the following technical choices:

### Frontend
- React 18 with TypeScript
- Vite as the build tool
- TanStack Query (React Query) for server state management
- React Router for navigation
- Tailwind CSS for styling
- Shadcn/ui component library for consistent UI components
- React Hook Form with Zod for form handling and validation
- Date-fns for date handling

### Backend
- Node.js with Express.js
- TypeScript throughout
- RESTful API design
- JWT-based authentication with refresh tokens
- Express Validator for request validation
- Multer for file uploads (item photos)
- Nodemailer for email notifications

### Database
- PostgreSQL 16 as the primary database
- Prisma as the ORM for type-safe database access
- Database migrations managed through Prisma

### Project Structure
Use a monorepo structure:
- /frontend - React application
- /backend - Express API server
- /shared - Shared types and utilities
- /docker - Docker configuration files
- /nginx - Nginx configuration

### Authentication & Authorization
- Passwords hashed with bcrypt
- JWT access tokens (15 min expiry) with refresh tokens (7 days)
- Role-based access control middleware checking user roles on protected routes
- Session management with secure HTTP-only cookies for refresh tokens

### File Storage
- Item photos stored in a Docker volume mounted at /app/uploads
- Generate thumbnails on upload for list views
- File size limit of 5MB per image
- Accepted formats: JPEG, PNG, WebP

### API Design
RESTful endpoints following this pattern:
- GET /api/items - List items with pagination, filtering, sorting
- GET /api/items/:id - Get single item with full details
- POST /api/items - Create new item
- PUT /api/items/:id - Update item
- DELETE /api/items/:id - Soft delete item
- DELETE /api/items/:id/permanent - Hard delete (admin only)
- GET /api/items/:id/history - Get item assignment history

- GET /api/employees - List employees
- GET /api/employees/:id - Get employee with current assignments
- GET /api/employees/:id/history - Get employee assignment history

- GET /api/assignments - List assignments with filters
- POST /api/assignments - Create new assignment
- PUT /api/assignments/:id/return - Process item return
- PUT /api/assignments/:id/transfer - Transfer to another employee

- GET /api/reports/inventory - Inventory summary report
- GET /api/reports/assignments - Assignment report with date range
- GET /api/reports/employee/:id - Employee equipment report

- GET /api/audit-log - Paginated audit log with filters

- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- POST /api/auth/refresh - Refresh access token
- GET /api/auth/me - Get current user

### Database Schema Approach
- Use UUIDs for primary keys
- Soft deletes using deletedAt timestamp (null = not deleted)
- Created/updated timestamps on all tables
- Audit log table capturing all data modifications with before/after JSON snapshots

### Security Requirements
- HTTPS only in production (terminated at Nginx)
- CORS configured for frontend origin only
- Rate limiting on authentication endpoints
- Input sanitization to prevent XSS
- Parameterized queries via Prisma to prevent SQL injection
- Helmet.js for security headers
- CSRF protection for state-changing operations

### Email Configuration
- Use environment variables for SMTP configuration
- Email templates for: assignment notification, return reminder, overdue alert, warranty warning
- Queue emails for async sending using Bull with Redis

---

### Containerization & Deployment

#### Docker Architecture
The application will be fully containerized using Docker with the following services:

**Services:**
1. **frontend** - Nginx serving the built React static files
2. **backend** - Node.js Express API server
3. **postgres** - PostgreSQL 16 database
4. **redis** - Redis for session store and email queue
5. **nginx** - Reverse proxy handling SSL termination and routing

#### Container Images
- Frontend: Multi-stage build - Node for building, Nginx Alpine for serving
- Backend: Node 20 Alpine base image
- Database: Official postgres:16-alpine
- Redis: Official redis:7-alpine
- Proxy: Official nginx:alpine

#### Docker Compose Structure
Create docker-compose.yml for local development and docker-compose.prod.yml for production:

**Development (docker-compose.yml):**
- Hot reload enabled for frontend and backend
- PostgreSQL with persistent volume
- Exposed ports for debugging
- Environment variables from .env file

**Production (docker-compose.prod.yml):**
- Optimized production builds
- No exposed ports except 80/443 through Nginx
- Restart policies (always)
- Resource limits defined
- Health checks for all services
- Named volumes for data persistence

#### Volumes (Persistent Data)
- postgres_data: PostgreSQL database files
- redis_data: Redis persistence
- uploads_data: User uploaded item photos
- ssl_certs: SSL certificates

#### Network Configuration
- Create isolated Docker network (it-inventory-network)
- Only Nginx exposed to host
- Internal services communicate via Docker DNS

#### Nginx Reverse Proxy Configuration
- SSL/TLS termination with Let's Encrypt certificates
- Proxy /api/* requests to backend container
- Serve frontend static files
- Gzip compression enabled
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Rate limiting at proxy level
- WebSocket support if needed for real-time features

#### SSL/TLS Setup
- Use Certbot with Let's Encrypt for free SSL certificates
- Auto-renewal via cron job or certbot timer
- Redirect HTTP to HTTPS
- Modern TLS configuration (TLS 1.2+ only)

#### Environment Configuration
Use .env files with the following structure:

```
# Database
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=it_inventory
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Backend
NODE_ENV=production
JWT_SECRET=<secure_random_string>
JWT_REFRESH_SECRET=<secure_random_string>
API_PORT=3000

# Redis
REDIS_URL=redis://redis:6379

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@company.com
SMTP_PASS=<email_password>
SMTP_FROM=IT Inventory <notifications@company.com>

# Frontend
VITE_API_URL=https://inventory.company.com/api

# Domain
DOMAIN=inventory.company.com
```

#### Deployment Process
1. **Build Phase:**
   - Build frontend: `docker build -t it-inventory-frontend:latest ./frontend`
   - Build backend: `docker build -t it-inventory-backend:latest ./backend`
   
2. **Deploy Phase:**
   - Copy docker-compose.prod.yml and .env.production to server
   - Pull/load images on server
   - Run `docker compose -f docker-compose.prod.yml up -d`
   - Run database migrations: `docker compose exec backend npx prisma migrate deploy`

3. **First-time Setup:**
   - Seed admin user: `docker compose exec backend npm run seed:admin`
   - Initialize SSL: Run certbot for domain verification

#### Linux Server Requirements
- Ubuntu 22.04 LTS or Debian 12 recommended
- Docker Engine 24+ and Docker Compose v2
- Minimum 2 CPU cores, 4GB RAM, 50GB storage
- Ports 80 and 443 open for HTTP/HTTPS
- SSH access for deployment

#### Backup Strategy
- PostgreSQL: Daily pg_dump to backup volume, rotate 7 days
- Uploads: Sync to backup location or cloud storage
- Create backup script in /docker/scripts/backup.sh
- Cron job for automated daily backups

#### Monitoring & Logging
- Docker logs aggregated via `docker compose logs`
- Consider adding Prometheus + Grafana for metrics (optional)
- Backend logs in JSON format for easy parsing
- Log rotation configured in Docker daemon

#### CI/CD Pipeline
Provide GitHub Actions workflow for:
- Build and test on push to main
- Build Docker images
- Push to GitHub Container Registry (ghcr.io)
- SSH deploy to production server
- Run database migrations
- Health check verification

---

### Development Setup
- Docker Compose for local development with hot reload
- Environment variables via .env files (with .env.example template)
- ESLint and Prettier for code formatting
- Husky for pre-commit hooks

### Testing Strategy
- Unit tests with Vitest for frontend components and utilities
- Integration tests for API endpoints using Supertest
- Prisma test database for isolated testing (separate Docker service)
- Minimum 70% code coverage target for core business logic
- E2E tests with Playwright for critical user flows

### Implementation Workflow Per User Story

**CRITICAL: After completing each user story, you MUST:**

1. **Write Tests for the User Story:**
   - Write unit tests for all new components, services, and utilities created
   - Write integration tests for any new API endpoints
   - Write E2E test covering the user story's main flow
   - Tests should cover happy path and key error scenarios

2. **Run All Tests:**
   - Run the full test suite: `npm run test` (or `docker compose exec backend npm run test`)
   - Ensure all new tests pass
   - Ensure no existing tests are broken (regression check)
   - Generate coverage report and verify coverage threshold is met

3. **Mark User Story as Complete:**
   - Update tasks.md: Change `[ ]` to `[x]` for all completed tasks in that user story
   - Update spec.md: In the User Stories section, mark the user story as `[x] COMPLETE`
   - Add completion timestamp comment: `<!-- Completed: YYYY-MM-DD -->`
   - If there's a checklist in checklists/requirements.md, check off validated items

4. **Commit Checkpoint:**
   - Create a git commit with message: `feat(US-XXX): [User Story Title] - COMPLETE`
   - Include all implementation code and tests in the commit
   - Tag significant milestones if needed

**Test Execution Commands:**
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode during development
npm run test:watch

# Run tests in Docker
docker compose exec backend npm run test
docker compose exec frontend npm run test
```

**Example User Story Completion in tasks.md:**
```markdown
## User Story 1: Add New Equipment
- [x] T001: Create Item model and Prisma schema
- [x] T002: Create item validation schemas (Zod)
- [x] T003: Implement POST /api/items endpoint
- [x] T004: Write unit tests for Item service
- [x] T005: Write integration tests for items API
- [x] T006: Create AddItemForm component
- [x] T007: Write component tests for AddItemForm
- [x] T008: Run full test suite - ALL PASSING ✓
<!-- US-001 Completed: 2025-01-15 -->
```

**Example User Story Completion in spec.md:**
```markdown
## User Stories

### [x] US-001: Add New Equipment to Inventory (COMPLETE)
<!-- Completed: 2025-01-15 | Tests: 23 passing | Coverage: 78% -->
As an IT administrator, I want to add new equipment...

### [ ] US-002: Assign Equipment to Employee
As an IT administrator, I want to assign equipment...
```
```

---

## Alternative: Simpler Single-Container Approach

If you prefer a simpler setup with fewer containers:

```
/speckit.plan

Use Next.js 14 with App Router for a full-stack application combining frontend and API.
TypeScript throughout. Prisma with PostgreSQL for the database. 
NextAuth.js for authentication. Tailwind CSS with Shadcn/ui for styling.

### Containerization
Single application container running Next.js in standalone mode.
PostgreSQL in separate container. Nginx as reverse proxy with SSL.

Docker Compose with three services only:
1. app - Next.js application (port 3000 internal)
2. postgres - PostgreSQL 16
3. nginx - Reverse proxy with SSL termination

Simpler deployment with fewer moving parts. All API routes handled by Next.js.
Store uploads in Docker volume mounted to /app/public/uploads.

Deploy to Linux server (Ubuntu 22.04) using Docker Compose.
Use Let's Encrypt for SSL certificates via Certbot.
GitHub Actions for CI/CD: build image, push to registry, deploy via SSH.
```

---

## Alternative: .NET with Docker

```
/speckit.plan

Use .NET 8 with ASP.NET Core Web API for the backend. Entity Framework Core 
with PostgreSQL. Blazor Server for the frontend with MudBlazor component library.
JWT authentication with ASP.NET Core Identity. AutoMapper for DTOs.
FluentValidation for request validation. Serilog for structured logging.

### Containerization
Docker multi-stage builds using official .NET SDK and ASP.NET runtime images.

Docker Compose services:
1. frontend - Blazor Server app (Kestrel behind Nginx)
2. backend - ASP.NET Core Web API
3. postgres - PostgreSQL 16
4. nginx - Reverse proxy with SSL termination

Deploy to Linux server using Docker Compose.
Use Let's Encrypt with Certbot for SSL.
GitHub Actions with dotnet publish and Docker build.
Health checks via ASP.NET Core health check endpoints.
```

---

## Implementation Workflow Instructions (Apply to All Tech Stacks)

**Add this to ANY /speckit.plan prompt you use:**

```
### Implementation Workflow Per User Story

CRITICAL REQUIREMENT: After completing each user story implementation, you MUST:

1. WRITE TESTS for all code created in that user story:
   - Unit tests for components, services, utilities, and business logic
   - Integration tests for new API endpoints
   - E2E test covering the user story's primary flow
   - Cover both happy path and error scenarios

2. RUN THE FULL TEST SUITE:
   - Execute all tests (unit, integration, E2E)
   - Verify all new tests pass
   - Verify no regression in existing tests
   - Check coverage meets minimum threshold (70%)

3. MARK AS COMPLETE:
   - In tasks.md: Change [ ] to [x] for all completed tasks in that user story
   - In spec.md: Mark the user story with [x] COMPLETE
   - Add completion comment with date: <!-- Completed: YYYY-MM-DD -->
   - Note test results: tests passing count and coverage percentage

4. GIT COMMIT:
   - Commit with message format: feat(US-XXX): [User Story Title] - COMPLETE
   - Include all code and tests in the commit

DO NOT proceed to the next user story until:
- All tests for current user story are written and passing
- The user story is marked complete in tasks.md and spec.md
- Changes are committed to git
```
