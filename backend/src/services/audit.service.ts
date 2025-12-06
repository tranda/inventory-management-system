// Audit Service - Constitution Art. 5.4: Immutable audit trail
// Records who, what, when, before/after, IP, user agent for all actions

import type { Request } from 'express';
import { prisma } from '../app.js';

// =============================================================================
// Types
// =============================================================================

export type EntityType = 'Item' | 'Assignment' | 'Employee' | 'User';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ASSIGN'
  | 'RETURN'
  | 'TRANSFER'
  | 'STATUS_CHANGE'
  | 'DECOMMISSION'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE';

export interface AuditMetadata {
  ipAddress: string;
  userAgent: string;
  [key: string]: unknown;
}

export interface AuditLogInput {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata: AuditMetadata;
}

// =============================================================================
// Audit Context Extraction
// =============================================================================

/**
 * Extract audit metadata from Express request.
 * Constitution Art. 5.4: Must capture IP address and user agent.
 */
export function extractAuditMetadata(req: Request): AuditMetadata {
  return {
    ipAddress: req.clientIp || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}

// =============================================================================
// Audit Log Creation
// =============================================================================

/**
 * Create an audit log entry.
 * Constitution Art. 5.4: Append-only, no updates or deletes.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      userId: input.userId,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      metadata: input.metadata,
    },
  });
}

/**
 * Create an audit log for entity creation.
 */
export async function auditCreate(
  req: Request,
  entityType: EntityType,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;

  await createAuditLog({
    entityType,
    entityId,
    action: 'CREATE',
    userId: req.user.id,
    before: null,
    after: sanitizeForAudit(data),
    metadata: extractAuditMetadata(req),
  });
}

/**
 * Create an audit log for entity update.
 */
export async function auditUpdate(
  req: Request,
  entityType: EntityType,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;

  await createAuditLog({
    entityType,
    entityId,
    action: 'UPDATE',
    userId: req.user.id,
    before: sanitizeForAudit(before),
    after: sanitizeForAudit(after),
    metadata: extractAuditMetadata(req),
  });
}

/**
 * Create an audit log for entity deletion (soft delete).
 */
export async function auditDelete(
  req: Request,
  entityType: EntityType,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;

  await createAuditLog({
    entityType,
    entityId,
    action: 'DELETE',
    userId: req.user.id,
    before: sanitizeForAudit(data),
    after: null,
    metadata: extractAuditMetadata(req),
  });
}

/**
 * Create an audit log for item assignment.
 */
export async function auditAssignment(
  req: Request,
  assignmentId: string,
  itemId: string,
  employeeId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;

  const metadata = {
    ...extractAuditMetadata(req),
    itemId,
    employeeId,
  };

  await createAuditLog({
    entityType: 'Assignment',
    entityId: assignmentId,
    action: 'ASSIGN',
    userId: req.user.id,
    before: null,
    after: sanitizeForAudit(data),
    metadata,
  });
}

/**
 * Create an audit log for item return.
 */
export async function auditReturn(
  req: Request,
  assignmentId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  if (!req.user) return;

  await createAuditLog({
    entityType: 'Assignment',
    entityId: assignmentId,
    action: 'RETURN',
    userId: req.user.id,
    before: sanitizeForAudit(before),
    after: sanitizeForAudit(after),
    metadata: extractAuditMetadata(req),
  });
}

/**
 * Create an audit log for item transfer.
 */
export async function auditTransfer(
  req: Request,
  oldAssignmentId: string,
  newAssignmentId: string,
  itemId: string,
  fromEmployeeId: string,
  toEmployeeId: string
): Promise<void> {
  if (!req.user) return;

  const metadata = {
    ...extractAuditMetadata(req),
    itemId,
    fromEmployeeId,
    toEmployeeId,
    newAssignmentId,
  };

  await createAuditLog({
    entityType: 'Assignment',
    entityId: oldAssignmentId,
    action: 'TRANSFER',
    userId: req.user.id,
    before: { employeeId: fromEmployeeId },
    after: { employeeId: toEmployeeId },
    metadata,
  });
}

/**
 * Create an audit log for status change.
 */
export async function auditStatusChange(
  req: Request,
  entityType: EntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
): Promise<void> {
  if (!req.user) return;

  const metadata = {
    ...extractAuditMetadata(req),
    reason,
  };

  await createAuditLog({
    entityType,
    entityId,
    action: 'STATUS_CHANGE',
    userId: req.user.id,
    before: { status: oldStatus },
    after: { status: newStatus },
    metadata,
  });
}

/**
 * Create an audit log for item decommission.
 */
export async function auditDecommission(
  req: Request,
  itemId: string,
  before: Record<string, unknown>,
  reason: string
): Promise<void> {
  if (!req.user) return;

  const metadata = {
    ...extractAuditMetadata(req),
    reason,
  };

  await createAuditLog({
    entityType: 'Item',
    entityId: itemId,
    action: 'DECOMMISSION',
    userId: req.user.id,
    before: sanitizeForAudit(before),
    after: { status: 'DECOMMISSIONED', decommissionReason: reason },
    metadata,
  });
}

/**
 * Create an audit log for user login.
 */
export async function auditLogin(req: Request, userId: string): Promise<void> {
  await createAuditLog({
    entityType: 'User',
    entityId: userId,
    action: 'LOGIN',
    userId,
    before: null,
    after: { timestamp: new Date().toISOString() },
    metadata: extractAuditMetadata(req),
  });
}

/**
 * Create an audit log for user logout.
 */
export async function auditLogout(req: Request): Promise<void> {
  if (!req.user) return;

  await createAuditLog({
    entityType: 'User',
    entityId: req.user.id,
    action: 'LOGOUT',
    userId: req.user.id,
    before: null,
    after: { timestamp: new Date().toISOString() },
    metadata: extractAuditMetadata(req),
  });
}

// =============================================================================
// Query Functions
// =============================================================================

export interface AuditLogQuery {
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Query audit logs with filtering and pagination.
 */
export async function queryAuditLogs(query: AuditLogQuery) {
  const { page = 1, limit = 20, ...filters } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get audit history for a specific entity.
 */
export async function getEntityAuditHistory(entityType: EntityType, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Remove sensitive fields before storing in audit log.
 */
function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // Remove sensitive fields
  const sensitiveFields = ['passwordHash', 'password', 'refreshToken'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Convert Date objects to ISO strings for JSON storage
  for (const [key, value] of Object.entries(sanitized)) {
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    }
  }

  return sanitized;
}
