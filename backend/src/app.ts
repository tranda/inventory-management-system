// IT Inventory Management System - Express Application
// Constitution Art. 8.2: Fail-fast environment validation

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { itemsRoutes } from './routes/items.routes.js';
import { assignmentsRoutes } from './routes/assignments.routes.js';
import { employeesRoutes } from './routes/employees.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { reportsRoutes } from './routes/reports.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { auditRoutes } from './routes/audit.routes.js';

// =============================================================================
// Environment Validation (Constitution Art. 8.2: Fail-fast)
// =============================================================================

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

function validateEnvironment(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('ERROR: Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }
}

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

validateEnvironment();

// =============================================================================
// Database Client
// =============================================================================

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// =============================================================================
// Express Application Setup
// =============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Request parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (_error) {
    res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

// =============================================================================
// API Routes
// =============================================================================

app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);
app.use('/assignments', assignmentsRoutes);
app.use('/employees', employeesRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportsRoutes);
app.use('/users', usersRoutes);
app.use('/audit-logs', auditRoutes);

// =============================================================================
// Error Handling (Constitution Art. 7)
// =============================================================================

app.use(errorMiddleware);

// =============================================================================
// Server Startup
// =============================================================================

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
