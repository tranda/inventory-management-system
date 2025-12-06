# Spec Kit Input for /speckit.constitution Command

## How to Use

Run this prompt with the `/speckit.constitution` command FIRST, before `/speckit.specify`.

If you've already run `/speckit.specify` and `/speckit.plan`, you can still run `/speckit.constitution` to establish principles - they will guide the remaining implementation phases.

---

## /speckit.constitution Prompt

```
/speckit.constitution

Create a project constitution for an internal IT Inventory Management System with the following governing principles:

---

## Article 1: Code Quality Standards

### 1.1 TypeScript Strictness
- All code MUST be written in TypeScript with strict mode enabled
- No use of `any` type - use proper typing or `unknown` with type guards
- All functions must have explicit return types
- All API responses must have typed interfaces

### 1.2 Code Organization
- Follow feature-based folder structure, not type-based
- Each feature should be self-contained with its components, hooks, services, and tests
- Shared utilities go in /shared, but prefer co-location when possible
- Maximum file length: 300 lines - split if larger

### 1.3 Naming Conventions
- Components: PascalCase (e.g., ItemDetailCard.tsx)
- Hooks: camelCase with "use" prefix (e.g., useItemAssignment.ts)
- Services: camelCase with descriptive names (e.g., itemService.ts)
- API routes: kebab-case URLs, camelCase handlers
- Database tables: snake_case
- Environment variables: SCREAMING_SNAKE_CASE

---

## Article 2: Testing Requirements

### 2.1 Test Coverage Mandates
- Minimum 70% code coverage for all business logic
- 100% coverage for critical paths: authentication, authorization, data mutations
- Every API endpoint MUST have integration tests
- Every user-facing component MUST have unit tests

### 2.2 Test-Driven Workflow
- Tests MUST be written as part of each user story implementation
- No user story is complete until all its tests pass
- Test files live alongside source files: `Component.tsx` → `Component.test.tsx`
- Use descriptive test names: `it('should return 401 when token is expired')`

### 2.3 Test Types Required
- Unit tests: For pure functions, utilities, hooks, and components in isolation
- Integration tests: For API endpoints with real database (test container)
- E2E tests: For critical user flows (login, assign item, return item)

### 2.4 No Skipping Tests
- `it.skip()` and `describe.skip()` are NOT allowed in committed code
- Flaky tests must be fixed immediately, not skipped
- All tests must pass before merging to main branch

---

## Article 3: User Story Completion Protocol

### 3.1 Definition of Done
A user story is ONLY complete when:
1. All acceptance criteria are implemented
2. All tests are written and passing
3. Code review checklist is satisfied
4. tasks.md is updated with [x] for all tasks
5. spec.md user story is marked [x] COMPLETE with timestamp
6. Changes are committed with proper message format

### 3.2 Commit Message Format
- Format: `feat(US-XXX): [Brief Description] - COMPLETE`
- Example: `feat(US-001): Add new equipment to inventory - COMPLETE`
- Include scope for non-feature commits: `fix(api):`, `chore(deps):`, `docs:`

### 3.3 Progress Tracking
- Update tasks.md in real-time as tasks complete
- Never mark a task complete until tests verify it works
- Add completion timestamps for audit trail

---

## Article 4: API Design Principles

### 4.1 RESTful Standards
- Use proper HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Use proper status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- All responses must be JSON with consistent structure
- Use pagination for list endpoints (limit/offset or cursor-based)

### 4.2 Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```
Error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": [{ "field": "email", "message": "Invalid format" }]
  }
}
```

### 4.3 Validation
- Validate ALL inputs at API boundary using Zod schemas
- Never trust client data - validate on server even if validated on client
- Return specific validation errors, not generic messages

---

## Article 5: Security Requirements

### 5.1 Authentication
- All endpoints except /auth/login require valid JWT
- Tokens expire in 15 minutes - use refresh tokens for session continuity
- Store refresh tokens in HTTP-only secure cookies
- Invalidate all tokens on password change

### 5.2 Authorization
- Check user role on EVERY protected endpoint
- Use middleware for role checks, not inline code
- Log all authorization failures for security audit
- Principle of least privilege: default deny, explicit allow

### 5.3 Data Protection
- Never log sensitive data (passwords, tokens, PII)
- Sanitize all user inputs before database operations
- Use parameterized queries only (Prisma handles this)
- Encrypt sensitive fields at rest if required by policy

### 5.4 Audit Trail
- Log ALL data modifications with: who, what, when, before/after values
- Audit logs are append-only - never delete or modify
- Include IP address and user agent in audit entries

---

## Article 6: Database Principles

### 6.1 Schema Design
- Use UUIDs for primary keys (not auto-increment integers)
- Every table MUST have: id, created_at, updated_at
- Use soft deletes (deleted_at timestamp) - never hard delete user data
- Define foreign key constraints for referential integrity

### 6.2 Migrations
- All schema changes go through Prisma migrations
- Migrations must be reversible when possible
- Never modify production data in migrations - use separate scripts
- Test migrations on copy of production data before deploying

### 6.3 Query Performance
- Add indexes for frequently queried columns
- Use pagination for all list queries - no unbounded selects
- Monitor slow queries and optimize proactively

---

## Article 7: Error Handling

### 7.1 Backend Errors
- Use custom error classes with error codes
- Catch errors at controller level - don't let them bubble to framework
- Log full error stack traces server-side
- Return sanitized error messages to client (no stack traces)

### 7.2 Frontend Errors
- Use error boundaries to catch React errors
- Show user-friendly error messages, not technical details
- Provide recovery actions when possible ("Try again", "Go back")
- Log frontend errors to backend for monitoring

### 7.3 Never Fail Silently
- Every catch block must either handle or re-throw
- Empty catch blocks are forbidden
- Log errors even when gracefully handled

---

## Article 8: Containerization & Deployment

### 8.1 Docker Standards
- Use multi-stage builds to minimize image size
- Use specific version tags, not :latest in production
- Run containers as non-root user
- Define health checks for all services

### 8.2 Environment Configuration
- All configuration via environment variables
- Never commit secrets or .env files
- Provide .env.example with all required variables documented
- Validate required env vars at startup - fail fast if missing

### 8.3 Deployment Process
- All deployments go through CI/CD pipeline
- Run full test suite before deployment
- Database migrations run automatically on deploy
- Maintain ability to rollback to previous version

---

## Article 9: Documentation

### 9.1 Code Documentation
- Document complex business logic with comments explaining "why"
- Keep README.md updated with setup instructions
- Document all API endpoints (can use OpenAPI/Swagger)
- Document environment variables in .env.example

### 9.2 Architecture Decisions
- Record significant decisions in docs/decisions/ folder
- Use ADR (Architecture Decision Record) format
- Include context, decision, and consequences

---

## Article 10: Simplicity First

### 10.1 No Premature Optimization
- Build the simple solution first
- Optimize only when metrics prove it's needed
- Avoid over-engineering - this is an internal tool

### 10.2 Minimal Dependencies
- Evaluate necessity before adding any new dependency
- Prefer well-maintained, widely-used packages
- Check bundle size impact for frontend dependencies
- Pin dependency versions for reproducible builds

### 10.3 YAGNI (You Aren't Gonna Need It)
- Don't build features "for later"
- Don't add abstractions without immediate use cases
- Keep the codebase lean and maintainable
```

---

## Notes

The constitution establishes non-negotiable principles that will guide:
- How code is written and organized
- How features are tested and validated
- How user stories are marked complete
- Security and data handling requirements
- Deployment and operational standards

These principles are referenced during `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` to ensure consistency throughout development.
