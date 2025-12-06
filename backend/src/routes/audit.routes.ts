// Audit Routes - Constitution Art. 5.4: Immutable audit trail
// Query and view audit logs

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { validate } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { auditLogQuerySchema, entityHistoryParamsSchema } from '../validators/audit.validators.js';
import { queryAuditLogs, getEntityAuditHistory } from '../services/audit.service.js';
import type { ApiResponse, PaginatedResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /audit-logs - Query audit logs with filtering
// =============================================================================

router.get(
  '/',
  requirePermission('audit:read'),
  validate({ query: auditLogQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        entityType,
        entityId,
        userId,
        action,
        startDate,
        endDate,
      } = req.query as Record<string, unknown>;

      const result = await queryAuditLogs({
        entityType: entityType as 'Item' | 'Assignment' | 'Employee' | 'User' | undefined,
        entityId: entityId as string | undefined,
        userId: userId as string | undefined,
        action: action as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page as number,
        limit: limit as number,
      });

      const response: PaginatedResponse<typeof result.data> = {
        success: true,
        data: result.data,
        meta: {
          pagination: result.pagination,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /audit-logs/entity/:entityType/:entityId - Get history for specific entity
// =============================================================================

router.get(
  '/entity/:entityType/:entityId',
  requirePermission('audit:read'),
  validate({ params: entityHistoryParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;

      const logs = await getEntityAuditHistory(
        entityType as 'Item' | 'Assignment' | 'Employee' | 'User',
        entityId
      );

      const response: ApiResponse<typeof logs> = {
        success: true,
        data: logs,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /audit-logs/stats - Get audit log statistics
// =============================================================================

router.get(
  '/stats',
  requirePermission('audit:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalLogs,
        logsToday,
        logsThisWeek,
        byAction,
        byEntityType,
        topUsers,
      ] = await Promise.all([
        prisma.auditLog.count(),

        prisma.auditLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),

        prisma.auditLog.count({
          where: { createdAt: { gte: oneWeekAgo } },
        }),

        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        prisma.auditLog.groupBy({
          by: ['entityType'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        prisma.auditLog.groupBy({
          by: ['userId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ]);

      // Get user names for top users
      const userIds = topUsers.map((u) => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      const topUsersWithNames = topUsers.map((u) => {
        const user = users.find((usr) => usr.id === u.userId);
        return {
          userId: u.userId,
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          email: user?.email,
          count: u._count.id,
        };
      });

      const response: ApiResponse<{
        total: number;
        today: number;
        thisWeek: number;
        byAction: Array<{ action: string; count: number }>;
        byEntityType: Array<{ entityType: string; count: number }>;
        topUsers: typeof topUsersWithNames;
      }> = {
        success: true,
        data: {
          total: totalLogs,
          today: logsToday,
          thisWeek: logsThisWeek,
          byAction: byAction.map((a) => ({ action: a.action, count: a._count.id })),
          byEntityType: byEntityType.map((e) => ({ entityType: e.entityType, count: e._count.id })),
          topUsers: topUsersWithNames,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /audit-logs/user/:userId - Get logs for specific user
// =============================================================================

router.get(
  '/user/:userId',
  requirePermission('audit:read'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        }),
        prisma.auditLog.count({ where: { userId } }),
      ]);

      const response: PaginatedResponse<typeof logs> = {
        success: true,
        data: logs,
        meta: {
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as auditRoutes };
