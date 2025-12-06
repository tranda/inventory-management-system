# Research: IT Inventory Management System

**Branch**: `001-it-inventory` | **Date**: 2025-12-05

## Overview

This document captures technology decisions, best practices research, and resolved clarifications for the IT Inventory Management System implementation.

---

## Technology Decisions

### 1. Frontend State Management

**Decision**: TanStack Query (React Query) for server state, React Context for UI state

**Rationale**:
- TanStack Query handles caching, background refetching, and optimistic updates out of the box
- Eliminates need for Redux/Zustand for server state
- React Context sufficient for minimal UI state (theme, sidebar toggle)
- Built-in devtools for debugging

**Alternatives Considered**:
- Redux Toolkit: Overkill for this application size; adds boilerplate
- Zustand: Good but TanStack Query already handles server state
- SWR: Similar to TanStack Query but less feature-rich

---

### 2. Form Handling & Validation

**Decision**: React Hook Form + Zod with shared schemas

**Rationale**:
- React Hook Form minimizes re-renders and has excellent TypeScript support
- Zod provides runtime validation with TypeScript type inference
- Shared Zod schemas between frontend and backend ensure consistent validation
- Built-in integration via `@hookform/resolvers/zod`

**Alternatives Considered**:
- Formik + Yup: More verbose, higher re-render count
- Native React forms: Too manual for complex forms with 15+ fields

---

### 3. Authentication Strategy

**Decision**: JWT with refresh tokens, HTTP-only cookies for refresh token

**Rationale**:
- Access token (15 min): Short-lived, stored in memory (not localStorage)
- Refresh token (7 days): HTTP-only cookie, secure, prevents XSS access
- Stateless verification for API routes (no session lookup required)
- Refresh endpoint rotates tokens for security

**Implementation Pattern**:
```
1. Login → Receive access token (memory) + refresh token (cookie)
2. API calls → Include access token in Authorization header
3. Token expired → Silent refresh via /auth/refresh
4. Refresh expired → Redirect to login
```

**Alternatives Considered**:
- Session-based: Requires Redis lookup on every request, doesn't scale as well
- OAuth2: Overkill for internal tool without third-party auth needs

---

### 4. File Upload & Image Processing

**Decision**: Multer + Sharp for thumbnail generation

**Rationale**:
- Multer is Express standard for multipart/form-data
- Sharp is fast (libvips-based) for image resizing
- Generate 150x150 thumbnails on upload for list views
- Store originals + thumbnails in Docker volume

**File Handling Flow**:
```
1. Upload → Multer validates (5MB max, JPEG/PNG/WebP)
2. Process → Sharp generates thumbnail
3. Store → /uploads/items/{itemId}/original.{ext}, /thumbnail.{ext}
4. Serve → Static file serving via Express or Nginx
```

**Alternatives Considered**:
- Cloud storage (S3): Adds external dependency; not needed for internal tool
- Cloudinary: Unnecessary for simple thumbnail needs

---

### 5. Email Queue System

**Decision**: Bull with Redis for async email processing

**Rationale**:
- Decouples email sending from request/response cycle
- Handles retries automatically on SMTP failures
- Supports delayed jobs (reminders, overdue alerts)
- Redis already needed for session store, no additional infrastructure

**Queue Jobs**:
- `assignment-notification`: Immediate on assignment creation
- `return-reminder`: Delayed, 3 days before expected return
- `overdue-alert`: Daily check for overdue items
- `warranty-warning`: Daily check for expiring warranties (30 days)

**Alternatives Considered**:
- Direct SMTP in request: Blocks response, no retry on failure
- Agenda.js: MongoDB-based, adds database dependency

---

### 6. Audit Logging Strategy

**Decision**: Database-backed audit log with JSON diff snapshots

**Rationale**:
- Store before/after JSON snapshots for complete change history
- Indexed by entity type, entity ID, user, timestamp for fast queries
- No external service dependency (vs. dedicated audit solutions)
- Searchable and filterable via SQL

**Schema Approach**:
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  entityType String   // "Item", "Assignment", "Employee"
  entityId   String
  action     String   // "CREATE", "UPDATE", "DELETE", "ASSIGN", "RETURN"
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  before     Json?    // null for CREATE
  after      Json?    // null for DELETE
  metadata   Json?    // additional context (IP, user agent, etc.)
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

**Alternatives Considered**:
- Trigger-based: Database-specific, harder to maintain
- Event sourcing: Overkill for audit requirements

---

### 7. Role-Based Access Control (RBAC)

**Decision**: Middleware-based role checking with permission constants

**Rationale**:
- Simple role enum (Admin, Manager, Viewer) covers requirements
- Express middleware validates role on protected routes
- Frontend conditionally renders based on user role
- No need for granular permission system

**Implementation Pattern**:
```typescript
// Middleware
const requireRole = (...roles: Role[]) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Usage
router.delete('/items/:id/permanent', requireRole('ADMIN'), permanentDeleteItem);
```

**Alternatives Considered**:
- CASL/Casbin: Adds complexity for 3-role system
- Attribute-based (ABAC): Not needed for simple role hierarchy

---

### 8. Database Indexing Strategy

**Decision**: Composite indexes for common query patterns

**Rationale**:
- Optimize for search (name, serial, asset ID, brand, model)
- Optimize for filters (category + status, status + deletedAt)
- Optimize for assignments (itemId + active, employeeId + active)
- Full-text search via PostgreSQL `tsvector` for item search

**Key Indexes**:
```prisma
@@index([category, status])           // Filter by category + status
@@index([status, deletedAt])          // Available items
@@index([serialNumber])               // Unique lookup
@@index([assetId])                    // Unique lookup
@@index([itemId, returnedAt])         // Active assignments per item
@@index([employeeId, returnedAt])     // Active assignments per employee
@@fulltext([name, brand, model])      // Search (PostgreSQL)
```

---

### 9. API Pagination & Filtering

**Decision**: Cursor-based pagination with query parameter filters

**Rationale**:
- Cursor pagination handles large datasets better than offset
- Consistent results when data changes during pagination
- Query params for filters: `?category=Laptop&status=Available&cursor=xxx`

**Response Format**:
```typescript
{
  data: Item[],
  pagination: {
    cursor: string | null,  // null if last page
    hasMore: boolean,
    total: number           // total matching filter
  }
}
```

**Alternatives Considered**:
- Offset pagination: Performance degrades at high offsets
- GraphQL connections: Adds GraphQL complexity

---

### 10. Docker Development Experience

**Decision**: Docker Compose with hot reload for development

**Rationale**:
- Consistent environment across team
- Hot reload via volume mounts (frontend, backend source)
- Separate dev and prod compose files
- Database persists between restarts

**Development Setup**:
```yaml
# docker-compose.yml (development)
services:
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev  # ts-node-dev with --watch
```

---

## Best Practices Applied

### Express.js API Best Practices
- Centralized error handling middleware
- Request validation before controller logic
- Consistent response format (`{ data, error, pagination }`)
- Rate limiting on auth endpoints (express-rate-limit)
- Helmet.js security headers enabled by default

### React Best Practices
- Component colocation (component + styles + tests together)
- Custom hooks for shared logic
- Error boundaries for graceful failure
- Suspense + lazy loading for code splitting
- Accessible components via Shadcn/ui (Radix primitives)

### TypeScript Best Practices
- Strict mode enabled
- Shared types in `shared/` package
- Zod schemas generate types via `z.infer<typeof schema>`
- No `any` types (enforced via ESLint)

### Security Best Practices
- HTTPS only in production
- HTTP-only cookies for refresh tokens
- CSRF protection via double-submit cookie pattern
- Input sanitization (DOMPurify for rendered content)
- Parameterized queries (Prisma prevents SQL injection)
- bcrypt with cost factor 12 for password hashing

---

## Resolved Clarifications

All technical context items were specified in the user's planning input. No NEEDS CLARIFICATION items remain.

| Item | Resolution |
|------|------------|
| Authentication method | JWT with refresh tokens (specified) |
| Database choice | PostgreSQL 16 with Prisma (specified) |
| File storage | Docker volume at /app/uploads (specified) |
| Email delivery | Nodemailer with Bull queue via Redis (specified) |
| Deployment target | Linux server with Docker Compose (specified) |

---

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices (Auth0)](https://auth0.com/blog/jwt-authentication-best-practices/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
