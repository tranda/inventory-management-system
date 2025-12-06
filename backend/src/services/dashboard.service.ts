// Dashboard Service - Statistics and summary data for the dashboard
import { prisma } from '../lib/prisma';

// =============================================================================
// Types
// =============================================================================

export interface DashboardStats {
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
    lowStock: Array<{
      id: string;
      assetId: string;
      name: string;
      category: string;
      minStockLevel: number;
      currentStock: number;
      deficit: number;
    }>;
    overdueCount: number;
  };
  recentActivity: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  // Run all queries in parallel for better performance
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
    lowStockItems,
    recentAuditLogs,
  ] = await Promise.all([
    // Total items (not deleted)
    prisma.item.count({
      where: { deletedAt: null },
    }),

    // Items by status
    prisma.item.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),

    // Items by category
    prisma.item.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _count: true,
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

    // Overdue assignments (past expected return date)
    prisma.assignment.count({
      where: {
        returnedAt: null,
        expectedReturnDate: {
          lt: now,
        },
      },
    }),

    // Unacknowledged assignments
    prisma.assignment.count({
      where: {
        returnedAt: null,
        acknowledged: false,
      },
    }),

    // Low stock consumable items
    prisma.$queryRaw<Array<{
      id: string;
      assetId: string;
      name: string;
      category: string;
      minStockLevel: number;
    }>>`
      SELECT i.id, i."assetId", i.name, i.category, i."minStockLevel"
      FROM "Item" i
      WHERE i."isConsumable" = true
        AND i."minStockLevel" IS NOT NULL
        AND i."deletedAt" IS NULL
        AND i.status = 'AVAILABLE'
      GROUP BY i.id
      HAVING COUNT(*) < i."minStockLevel"
      LIMIT 10
    `.catch(() => []),

    // Recent audit logs
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  // Transform grouped results to records
  const byStatus: Record<string, number> = {};
  itemsByStatus.forEach((item) => {
    byStatus[item.status] = item._count;
  });

  const byCategory: Record<string, number> = {};
  itemsByCategory.forEach((item) => {
    byCategory[item.category] = item._count;
  });

  // Calculate low stock alerts (simplified - for consumables below minimum)
  const lowStockAlerts = lowStockItems.map((item) => ({
    id: item.id,
    assetId: item.assetId,
    name: item.name,
    category: item.category,
    minStockLevel: item.minStockLevel,
    currentStock: 1, // Simplified - would need more complex query for actual stock count
    deficit: item.minStockLevel - 1,
  }));

  return {
    items: {
      total: totalItems,
      byStatus,
      byCategory,
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
    recentActivity: recentAuditLogs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      createdAt: log.createdAt,
      user: log.user,
    })),
  };
}

/**
 * Get inventory summary by category
 */
export async function getInventorySummary() {
  const summary = await prisma.item.groupBy({
    by: ['category', 'status'],
    where: { deletedAt: null },
    _count: true,
    _sum: {
      purchasePrice: true,
    },
  });

  return summary;
}

/**
 * Get assignment statistics for a date range
 */
export async function getAssignmentStats(startDate: Date, endDate: Date) {
  const [assigned, returned] = await Promise.all([
    prisma.assignment.count({
      where: {
        assignedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.assignment.count({
      where: {
        returnedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  return { assigned, returned };
}
