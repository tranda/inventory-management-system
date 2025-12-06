# Quickstart: IT Inventory Management System

**Branch**: `001-it-inventory` | **Date**: 2025-12-05

## Prerequisites

- **Node.js** 20 LTS or later
- **Docker** 24+ and **Docker Compose** v2
- **Git**
- **pnpm** (recommended) or npm

## Quick Start (Development)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd InventoryApp

# Install dependencies
pnpm install
# or: npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values (or use defaults for development)
```

**Minimum `.env` for development:**
```env
# Database
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=it_inventory
DATABASE_URL=postgresql://inventory_user:dev_password_123@localhost:5432/it_inventory

# Backend
NODE_ENV=development
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
API_PORT=3000

# Redis
REDIS_URL=redis://localhost:6379

# Email (optional for dev - uses console output)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Frontend
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
docker compose up -d

# Or start individual services:
docker compose up -d postgres redis  # Database and Redis only

# Run backend in dev mode (with hot reload)
cd backend
pnpm dev

# Run frontend in dev mode (in another terminal)
cd frontend
pnpm dev
```

### 4. Database Setup

```bash
# Run migrations
cd backend
npx prisma migrate dev

# Seed initial data (creates admin user)
npx prisma db seed
```

**Default Admin Credentials:**
- Email: `admin@company.com`
- Password: `admin123` (change immediately!)

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Docs** (if Swagger enabled): http://localhost:3000/api-docs

---

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 5173 | Vite dev server (hot reload) |
| backend | 3000 | Express API server |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis (sessions, email queue) |

---

## Common Development Commands

### Backend

```bash
cd backend

# Development with hot reload
pnpm dev

# Run tests
pnpm test
pnpm test:coverage

# Database commands
npx prisma migrate dev          # Create/apply migrations
npx prisma migrate reset        # Reset database
npx prisma studio               # Visual database browser
npx prisma generate             # Regenerate Prisma Client

# Linting
pnpm lint
pnpm lint:fix
```

### Frontend

```bash
cd frontend

# Development with hot reload
pnpm dev

# Run tests
pnpm test
pnpm test:coverage
pnpm test:e2e                   # Playwright E2E tests

# Build
pnpm build
pnpm preview                    # Preview production build

# Linting
pnpm lint
pnpm lint:fix
```

### Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f backend  # Specific service

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v

# Rebuild images
docker compose build
docker compose up -d --build
```

---

## Project Structure Overview

```
InventoryApp/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API client (TanStack Query)
│   │   └── lib/            # Utilities
│   └── tests/
│
├── backend/                # Express API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # Route definitions
│   │   ├── validators/     # Zod schemas
│   │   ├── prisma/         # Database schema
│   │   └── jobs/           # Background jobs (Bull)
│   └── tests/
│
├── shared/                 # Shared types & constants
│   ├── types/
│   └── constants/
│
├── docker/                 # Docker configurations
├── nginx/                  # Nginx configuration
├── specs/                  # Feature specifications
│
├── docker-compose.yml      # Development
├── docker-compose.prod.yml # Production
└── .env.example            # Environment template
```

---

## Testing

### Run All Tests

```bash
# Backend tests
cd backend && pnpm test

# Frontend tests
cd frontend && pnpm test

# E2E tests (requires running app)
cd frontend && pnpm test:e2e
```

### Test Database

Tests use a separate PostgreSQL database to avoid affecting development data:

```bash
# In docker-compose.yml, there's a test database service
docker compose up -d postgres-test

# Tests automatically use DATABASE_URL_TEST
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Or change port in .env
API_PORT=3001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# Check PostgreSQL logs
docker compose logs postgres

# Reset database
npx prisma migrate reset
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma Client after schema changes
npx prisma generate
```

### Redis Connection Issues

```bash
# Check Redis is running
docker compose ps redis
docker compose logs redis

# Test connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

---

## Next Steps

1. **Review the spec**: [spec.md](./spec.md)
2. **Understand the data model**: [data-model.md](./data-model.md)
3. **Check API contracts**: [contracts/openapi.yaml](./contracts/openapi.yaml)
4. **Start with tasks**: Run `/speckit.tasks` to generate implementation tasks

---

## Production Deployment

See [plan.md](./plan.md) for full production deployment instructions including:
- Docker production builds
- Nginx SSL configuration
- Environment setup
- CI/CD pipeline
- Backup strategy
