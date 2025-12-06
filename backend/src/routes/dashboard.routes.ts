// Dashboard Routes - Constitution Art. 4.2: RESTful API
// Dashboard statistics and summary data

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import type { ApiResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /dashboard/stats - Get overview statistics
// =============================================================================

router.get(
  '/stats',
  requirePermission('dashboard:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();

      // Run all queries in parallel
      const [
        totalItems,
        itemsByStatus,
        itemsByCategory,
        totalEmployees,
        activeEmployees,
        totalAssignments,
        activeAssignments,
        overdueAssignments,
        unacknowledgedAssignments,
        recentActivity,
        lowStockItems,
      ] = await Promise.all([
        // Total items (not deleted)
        prisma.item.count({
          where: { deletedAt: null },
        }),

        // Items by status
        prisma.item.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: { id: true },
        }),

        // Items by category
        prisma.item.groupBy({
          by: ['category'],
          where: { deletedAt: null },
          _count: { id: true },
        }),

        // Total employees
        prisma.employee.count(),

        // Active employees
        prisma.employee.count({
          where: { isActive: true },
        }),

        // Total assignments
        prisma.assignment.count(),

        // Active assignments
        prisma.assignment.count({
          where: { returnedAt: null },
        }),

        // Overdue assignments
        prisma.assignment.count({
          where: {
            returnedAt: null,
            expectedReturnAt: { lt: now },
          },
        }),

        // Unacknowledged assignments
        prisma.assignment.count({
          where: {
            returnedAt: null,
            acknowledged: false,
          },
        }),

        // Recent activity (last 10 audit logs)
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        }),

        // Low stock items (consumables below min level)
        prisma.item.findMany({
          where: {
            deletedAt: null,
            isConsumable: true,
            minStockLevel: { not: null },
          },
          select: {
            id: true,
            assetId: true,
            name: true,
            category: true,
            minStockLevel: true,
          },
        }),
      ]);

      // Transform status counts
      const statusCounts: Record<string, number> = {};
      for (const item of itemsByStatus) {
        statusCounts[item.status] = item._count.id;
      }

      // Transform category counts
      const categoryCounts: Record<string, number> = {};
      for (const item of itemsByCategory) {
        categoryCounts[item.category] = item._count.id;
      }

      // Calculate low stock alerts
      // For each consumable item, count how many of that type are available
      const lowStockAlerts = [];
      for (const item of lowStockItems) {
        const availableCount = await prisma.item.count({
          where: {
            name: item.name,
            category: item.category,
            status: 'AVAILABLE',
            deletedAt: null,
          },
        });

        if (availableCount < (item.minStockLevel || 0)) {
          lowStockAlerts.push({
            ...item,
            currentStock: availableCount,
            deficit: (item.minStockLevel || 0) - availableCount,
          });
        }
      }

      const response: ApiResponse<{
        items: {
          total: number;
          byStatus: Record<string, number>;
          byCategory: Record<string, number>;
        };
        employees: {
          total: number;
          active: number;
        };
        assignments: {
          total: number;
          active: number;
          overdue: number;
          unacknowledged: number;
        };
        alerts: {
          lowStock: typeof lowStockAlerts;
          overdueCount: number;
        };
        recentActivity: typeof recentActivity;
      }> = {
        success: true,
        data: {
          items: {
            total: totalItems,
            byStatus: statusCounts,
            byCategory: categoryCounts,
          },
          employees: {
            total: totalEmployees,
            active: activeEmployees,
          },
          assignments: {
            total: totalAssignments,
            active: activeAssignments,
            overdue: overdueAssignments,
            unacknowledged: unacknowledgedAssignments,
          },
          alerts: {
            lowStock: lowStockAlerts,
            overdueCount: overdueAssignments,
          },
          recentActivity,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /dashboard/recent-assignments - Get recent assignments
// =============================================================================

router.get(
  '/recent-assignments',
  requirePermission('dashboard:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await prisma.assignment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          item: {
            select: { id: true, assetId: true, name: true, category: true },
          },
          employee: {
            select: { id: true, firstName: true, lastName: true, department: true },
          },
          assignedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const response: ApiResponse<typeof assignments> = {
        success: true,
        data: assignments,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /dashboard/items-by-category - Get item counts by category
// =============================================================================

router.get(
  '/items-by-category',
  requirePermission('dashboard:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await prisma.item.groupBy({
        by: ['category'],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { purchasePrice: true },
      });

      const result = categories.map((cat) => ({
        category: cat.category,
        count: cat._count.id,
        totalValue: cat._sum.purchasePrice || 0,
      }));

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /dashboard/assignments-by-department - Get assignment counts by department
// =============================================================================

router.get(
  '/assignments-by-department',
  requirePermission('dashboard:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await prisma.employee.findMany({
        where: {
          isActive: true,
          department: { not: null },
        },
        select: {
          department: true,
          _count: {
            select: {
              assignments: {
                where: { returnedAt: null },
              },
            },
          },
        },
      });

      // Aggregate by department
      const deptCounts: Record<string, number> = {};
      for (const emp of departments) {
        const dept = emp.department || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + emp._count.assignments;
      }

      const result = Object.entries(deptCounts).map(([department, activeAssignments]) => ({
        department,
        activeAssignments,
      }));

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result.sort((a, b) => b.activeAssignments - a.activeAssignments),
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /dashboard/warranty-expiring - Get items with expiring warranties
// =============================================================================

router.get(
  '/warranty-expiring',
  requirePermission('dashboard:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const items = await prisma.item.findMany({
        where: {
          deletedAt: null,
          warrantyExpiration: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          category: true,
          warrantyExpiration: true,
          brand: true,
          model: true,
        },
        orderBy: { warrantyExpiration: 'asc' },
      });

      const result = items.map((item) => ({
        ...item,
        daysUntilExpiry: Math.ceil(
          (new Date(item.warrantyExpiration!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as dashboardRoutes };
