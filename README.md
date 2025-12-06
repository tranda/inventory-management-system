# IT Inventory Management System

A comprehensive full-stack inventory management system for tracking IT assets, assignments, and equipment lifecycle.

## Features

- **Asset Management**: Track IT equipment with photos, specifications, and lifecycle data
- **Assignment Tracking**: Manage equipment assignments to employees
- **Audit Logging**: Complete audit trail for all system operations
- **User Management**: Role-based access control (Admin, Manager, User)
- **Dashboard**: Real-time statistics and alerts
- **Reports**: Generate comprehensive reports on inventory status
- **Warranty Alerts**: Automatic notifications for expiring warranties
- **Low Stock Alerts**: Track and alert on consumable inventory levels

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js 20** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Zod** for validation
- **BullMQ** for job queues
- **Sharp** for image processing

### Infrastructure
- **PostgreSQL 16** for database
- **Redis 7** for caching and queues
- **Docker** for containerization
- **Nginx** for serving frontend

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### Option 1: Run with Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/tranda/inventory-management-system.git
cd inventory-management-system
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

### Option 2: Local Development

1. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install shared dependencies
cd ../shared
npm install
```

2. Start PostgreSQL and Redis:
```bash
docker-compose up postgres redis -d
```

3. Set up the database:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

4. Start the development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
.
├── backend/              # Express.js backend
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── validators/  # Zod schemas
│   │   ├── jobs/        # Background jobs
│   │   └── utils/       # Utilities
│   └── tests/           # Test suites
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── contexts/    # React contexts
│   │   └── types/       # TypeScript types
│   └── tests/           # E2E and unit tests
├── shared/              # Shared types and constants
├── docker/              # Dockerfiles
├── nginx/               # Nginx configuration
└── specs/               # Project specifications

```

## Environment Variables

Create a `.env` file in the root directory (or use `.env.example` as a template):

```env
# Database
DATABASE_URL=postgresql://inventory:inventory_dev@localhost:5432/inventory
POSTGRES_USER=inventory
POSTGRES_PASSWORD=inventory_dev
POSTGRES_DB=inventory

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM=noreply@example.com
```

## API Documentation

API documentation is available in OpenAPI format at:
- File: `specs/001-it-inventory/contracts/openapi.yaml`
- When running: http://localhost:3000/api-docs (if configured)

## Testing

### Backend Tests
```bash
cd backend

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Building for Production

### Using Docker
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Manual Build
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

## Default Credentials

After running the seed script, you can login with:
- **Admin**: admin@example.com / Admin123!
- **Manager**: manager@example.com / Manager123!
- **User**: user@example.com / User123!

**⚠️ Change these credentials in production!**

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Create a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please create an issue on GitHub or contact the development team.
