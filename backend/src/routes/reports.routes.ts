// Reports Routes - Constitution Art. 4.2: RESTful API
// Report generation and export functionality

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { validate } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { z } from 'zod';
import type { ApiResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// Query Schemas
// =============================================================================

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const inventoryReportSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
});

const assignmentReportSchema = dateRangeSchema.extend({
  employeeId: z.string().uuid().optional(),
  department: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

const depreciationReportSchema = z.object({
  method: z.enum(['straight-line', 'declining-balance']).default('straight-line'),
  usefulLifeYears: z.coerce.number().min(1).max(20).default(5),
  format: z.enum(['json', 'csv']).default('json'),
});

// =============================================================================
// GET /reports/inventory-summary - Inventory summary with aggregations
// =============================================================================

router.get(
  '/inventory-summary',
  requirePermission('reports:read'),
  validate({ query: inventoryReportSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, includeDeleted } = req.query as Record<string, unknown>;

      const where: Record<string, unknown> = {};

      if (!includeDeleted) {
        where.deletedAt = null;
      }

      if (category) where.category = category;
      if (status) where.status = status;

      const items = await prisma.item.findMany({
        where,
        select: {
          id: true,
          category: true,
          status: true,
          condition: true,
          purchasePrice: true,
          purchaseDate: true,
        },
      });

      // Calculate summary statistics
      const totalValue = items.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);

      // Group by category
      const byCategory = Object.entries(
        items.reduce((acc, item) => {
          const cat = item.category;
          if (!acc[cat]) {
            acc[cat] = { count: 0, value: 0 };
          }
          acc[cat].count++;
          acc[cat].value += Number(item.purchasePrice || 0);
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      ).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value,
      }));

      // Group by status
      const byStatus = Object.entries(
        items.reduce((acc, item) => {
          const stat = item.status;
          if (!acc[stat]) {
            acc[stat] = 0;
          }
          acc[stat]++;
          return acc;
        }, {} as Record<string, number>)
      ).map(([status, count]) => ({
        status,
        count,
      }));

      // Group by condition
      const byCondition = Object.entries(
        items.reduce((acc, item) => {
          const cond = item.condition;
          if (!acc[cond]) {
            acc[cond] = 0;
          }
          acc[cond]++;
          return acc;
        }, {} as Record<string, number>)
      ).map(([condition, count]) => ({
        condition,
        count,
      }));

      // Calculate average age
      const now = new Date();
      const itemsWithAge = items.filter((item) => item.purchaseDate);
      const averageAge =
        itemsWithAge.length > 0
          ? itemsWithAge.reduce((sum, item) => {
              const ageYears =
                (now.getTime() - new Date(item.purchaseDate!).getTime()) /
                (1000 * 60 * 60 * 24 * 365);
              return sum + ageYears;
            }, 0) / itemsWithAge.length
          : 0;

      const response: ApiResponse<{
        totalItems: number;
        byCategory: typeof byCategory;
        byStatus: typeof byStatus;
        byCondition: typeof byCondition;
        totalValue: number;
        averageAge: number;
      }> = {
        success: true,
        data: {
          totalItems: items.length,
          byCategory,
          byStatus,
          byCondition,
          totalValue,
          averageAge,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/inventory - Inventory report with summary (for Reports page)
// =============================================================================

router.get(
  '/inventory',
  requirePermission('reports:read'),
  validate({ query: inventoryReportSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, status, includeDeleted, format } = req.query as Record<string, unknown>;

      const where: Record<string, unknown> = {};

      if (!includeDeleted) {
        where.deletedAt = null;
      }

      if (category) where.category = category;
      if (status) where.status = status;

      const items = await prisma.item.findMany({
        where,
        select: {
          id: true,
          assetId: true,
          name: true,
          category: true,
          status: true,
          condition: true,
          purchasePrice: true,
          purchaseDate: true,
          assignments: {
            where: { returnedAt: null },
            select: { id: true },
          },
        },
      });

      // Calculate summary statistics
      const totalValue = items.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
      const availableItems = items.filter((item) => item.status === 'available').length;
      const assignedItems = items.filter((item) => item.assignments.length > 0).length;

      // Group by category with value
      const categoryGroups = items.reduce((acc, item) => {
        const cat = item.category;
        if (!acc[cat]) {
          acc[cat] = { count: 0, totalValue: 0 };
        }
        acc[cat].count++;
        acc[cat].totalValue += Number(item.purchasePrice || 0);
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>);

      const byCategory = Object.entries(categoryGroups).map(([category, data]) => ({
        category,
        count: data.count,
        totalValue: data.totalValue,
      }));

      // Group by status
      const statusGroups = items.reduce((acc, item) => {
        const stat = item.status;
        if (!acc[stat]) {
          acc[stat] = 0;
        }
        acc[stat]++;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count,
      }));

      if (format === 'csv') {
        const csvData = items.map((item) => ({
          assetId: item.assetId,
          name: item.name,
          category: item.category,
          status: item.status,
          condition: item.condition,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
        }));
        const csv = convertToCSV(csvData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
        res.send(csv);
        return;
      }

      const response: ApiResponse<{
        summary: {
          totalItems: number;
          totalValue: number;
          availableItems: number;
          assignedItems: number;
        };
        byCategory: typeof byCategory;
        byStatus: typeof byStatus;
      }> = {
        success: true,
        data: {
          summary: {
            totalItems: items.length,
            totalValue,
            availableItems,
            assignedItems,
          },
          byCategory,
          byStatus,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/assignment-history - Assignment history with statistics
// =============================================================================

router.get(
  '/assignment-history',
  requirePermission('reports:read'),
  validate({ query: assignmentReportSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, employeeId, department } = req.query as Record<string, unknown>;

      const where: Record<string, unknown> = {};

      if (startDate || endDate) {
        where.assignedAt = {};
        if (startDate) (where.assignedAt as Record<string, unknown>).gte = new Date(startDate as string);
        if (endDate) (where.assignedAt as Record<string, unknown>).lte = new Date(endDate as string);
      }

      if (employeeId) where.employeeId = employeeId;

      if (department) {
        where.employee = { department };
      }

      const assignments = await prisma.assignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        include: {
          item: {
            select: {
              id: true,
              assetId: true,
              name: true,
              category: true,
            },
          },
          employee: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
      });

      // Transform for report with duration calculations
      const reportData = assignments.map((a) => {
        const duration = a.returnedAt
          ? Math.floor(
              (new Date(a.returnedAt).getTime() - new Date(a.assignedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return {
          id: a.id,
          itemAssetId: a.item.assetId,
          itemName: a.item.name,
          employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
          department: a.employee.department || '',
          assignedAt: a.assignedAt.toISOString(),
          returnedAt: a.returnedAt ? a.returnedAt.toISOString() : null,
          duration,
        };
      });

      // Calculate statistics
      const activeAssignments = reportData.filter((a) => !a.returnedAt).length;
      const completedAssignments = reportData.filter((a) => a.returnedAt);
      const averageDuration =
        completedAssignments.length > 0
          ? completedAssignments.reduce((sum, a) => sum + (a.duration || 0), 0) /
            completedAssignments.length
          : 0;

      const response: ApiResponse<{
        assignments: typeof reportData;
        totalAssignments: number;
        averageDuration: number;
        activeAssignments: number;
      }> = {
        success: true,
        data: {
          assignments: reportData,
          totalAssignments: reportData.length,
          averageDuration,
          activeAssignments,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/assignments - Assignments report with summary (for Reports page)
// =============================================================================

router.get(
  '/assignments',
  requirePermission('reports:read'),
  validate({ query: assignmentReportSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, employeeId, department, format } = req.query as Record<
        string,
        unknown
      >;

      const where: Record<string, unknown> = {};

      if (startDate || endDate) {
        where.assignedAt = {};
        if (startDate) (where.assignedAt as Record<string, unknown>).gte = new Date(startDate as string);
        if (endDate) (where.assignedAt as Record<string, unknown>).lte = new Date(endDate as string);
      }

      if (employeeId) where.employeeId = employeeId;

      if (department) {
        where.employee = { department };
      }

      const assignments = await prisma.assignment.findMany({
        where,
        include: {
          item: {
            select: {
              purchasePrice: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
      });

      // Calculate summary statistics
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeAssignments = assignments.filter((a) => !a.returnedAt).length;
      const returnedThisMonth = assignments.filter(
        (a) => a.returnedAt && new Date(a.returnedAt) >= monthStart
      ).length;
      const overdueAssignments = assignments.filter(
        (a) => !a.returnedAt && a.expectedReturnAt && new Date(a.expectedReturnAt) < now
      ).length;

      // Group by department
      const deptGroups: Record<string, { active: number; totalValue: number }> = {};
      assignments.forEach((a) => {
        if (!a.returnedAt) {
          const dept = a.employee.department || 'No Department';
          if (!deptGroups[dept]) {
            deptGroups[dept] = { active: 0, totalValue: 0 };
          }
          deptGroups[dept].active++;
          deptGroups[dept].totalValue += Number(a.item.purchasePrice || 0);
        }
      });

      const byDepartment = Object.entries(deptGroups).map(([department, data]) => ({
        department,
        activeAssignments: data.active,
        totalValue: data.totalValue,
      }));

      // Top employees by equipment count
      const empGroups: Record<string, { id: string; name: string; dept: string; count: number }> = {};
      assignments.forEach((a) => {
        if (!a.returnedAt) {
          const empId = a.employee.id;
          if (!empGroups[empId]) {
            empGroups[empId] = {
              id: empId,
              name: `${a.employee.firstName} ${a.employee.lastName}`,
              dept: a.employee.department || '',
              count: 0,
            };
          }
          empGroups[empId].count++;
        }
      });

      const topEmployees = Object.values(empGroups)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((emp) => ({
          employeeId: emp.id,
          name: emp.name,
          department: emp.dept,
          assignedItemsCount: emp.count,
        }));

      if (format === 'csv') {
        const csvData = assignments.map((a) => ({
          employee: `${a.employee.firstName} ${a.employee.lastName}`,
          department: a.employee.department || '',
          assignedAt: a.assignedAt,
          returnedAt: a.returnedAt,
          expectedReturnAt: a.expectedReturnAt,
        }));
        const csv = convertToCSV(csvData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assignments-report.csv');
        res.send(csv);
        return;
      }

      const response: ApiResponse<{
        summary: {
          totalAssignments: number;
          activeAssignments: number;
          returnedThisMonth: number;
          overdueAssignments: number;
        };
        byDepartment: typeof byDepartment;
        topEmployees: typeof topEmployees;
      }> = {
        success: true,
        data: {
          summary: {
            totalAssignments: assignments.length,
            activeAssignments,
            returnedThisMonth,
            overdueAssignments,
          },
          byDepartment,
          topEmployees,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/depreciation - Asset depreciation report (FR-033)
// =============================================================================

router.get(
  '/depreciation',
  requirePermission('reports:read'),
  validate({ query: depreciationReportSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { method, usefulLifeYears, format } = req.query as Record<string, unknown>;

      const items = await prisma.item.findMany({
        where: {
          deletedAt: null,
          purchaseDate: { not: null },
          purchasePrice: { not: null },
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          category: true,
          brand: true,
          model: true,
          purchaseDate: true,
          purchasePrice: true,
          status: true,
        },
        orderBy: [{ category: 'asc' }, { purchaseDate: 'asc' }],
      });

      const now = new Date();
      const yearsLife = usefulLifeYears as number;

      // Calculate depreciation for each item
      const reportData = items.map((item) => {
        const purchaseDate = new Date(item.purchaseDate!);
        const purchasePrice = Number(item.purchasePrice);
        const ageInYears =
          (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const ageInMonths = Math.floor(ageInYears * 12);

        let currentValue: number;
        let annualDepreciation: number;
        let accumulatedDepreciation: number;

        if (method === 'straight-line') {
          // Straight-line depreciation: equal amount each year
          annualDepreciation = purchasePrice / yearsLife;
          accumulatedDepreciation = Math.min(annualDepreciation * ageInYears, purchasePrice);
          currentValue = Math.max(purchasePrice - accumulatedDepreciation, 0);
        } else {
          // Declining balance (double declining): 2/useful life rate
          const rate = 2 / yearsLife;
          currentValue = purchasePrice;

          for (let year = 0; year < Math.floor(ageInYears) && currentValue > 0; year++) {
            currentValue = currentValue * (1 - rate);
          }

          // Partial year
          const partialYear = ageInYears - Math.floor(ageInYears);
          if (partialYear > 0) {
            currentValue = currentValue * (1 - rate * partialYear);
          }

          currentValue = Math.max(currentValue, 0);
          accumulatedDepreciation = purchasePrice - currentValue;
          annualDepreciation = purchasePrice * rate;
        }

        const depreciationPercentage = (accumulatedDepreciation / purchasePrice) * 100;

        return {
          assetId: item.assetId,
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model,
          status: item.status,
          purchaseDate: item.purchaseDate,
          purchasePrice: purchasePrice.toFixed(2),
          ageMonths: ageInMonths,
          ageYears: ageInYears.toFixed(2),
          depreciationMethod: method,
          usefulLifeYears: yearsLife,
          annualDepreciation: annualDepreciation.toFixed(2),
          accumulatedDepreciation: accumulatedDepreciation.toFixed(2),
          currentValue: currentValue.toFixed(2),
          depreciationPercentage: depreciationPercentage.toFixed(1),
          fullyDepreciated: currentValue === 0,
        };
      });

      // Summary statistics
      const summary = {
        totalOriginalValue: items.reduce((sum, i) => sum + Number(i.purchasePrice), 0),
        totalCurrentValue: reportData.reduce((sum, i) => sum + parseFloat(i.currentValue), 0),
        totalDepreciation: reportData.reduce(
          (sum, i) => sum + parseFloat(i.accumulatedDepreciation),
          0
        ),
        fullyDepreciatedCount: reportData.filter((i) => i.fullyDepreciated).length,
        averageAge:
          reportData.reduce((sum, i) => sum + parseFloat(i.ageYears), 0) / reportData.length || 0,
      };

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=depreciation-report.csv');
        res.send(csv);
        return;
      }

      const response: ApiResponse<{
        generatedAt: string;
        parameters: {
          method: string;
          usefulLifeYears: number;
        };
        summary: typeof summary;
        items: typeof reportData;
      }> = {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          parameters: {
            method: method as string,
            usefulLifeYears: yearsLife,
          },
          summary,
          items: reportData,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/equipment-by-employee - Equipment distribution by employee
// =============================================================================

router.get(
  '/equipment-by-employee',
  requirePermission('reports:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
        orderBy: [{ department: 'asc' }, { lastName: 'asc' }],
        include: {
          assignments: {
            include: {
              item: {
                select: {
                  assetId: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      const reportData = employees.map((emp) => {
        const activeItems = emp.assignments
          .filter((a) => !a.returnedAt)
          .map((a) => ({
            assetId: a.item.assetId,
            name: a.item.name,
            category: a.item.category,
            assignedAt: a.assignedAt.toISOString(),
          }));

        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department || '',
          activeAssignments: activeItems.length,
          totalHistorical: emp.assignments.length,
          currentItems: activeItems,
        };
      });

      const response: ApiResponse<{
        employees: typeof reportData;
      }> = {
        success: true,
        data: {
          employees: reportData,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/warranty-status - Warranty expiration tracking
// =============================================================================

router.get(
  '/warranty-status',
  requirePermission('reports:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await prisma.item.findMany({
        where: {
          deletedAt: null,
          warrantyExpiration: { not: null },
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          category: true,
          warrantyExpiration: true,
        },
        orderBy: { warrantyExpiration: 'asc' },
      });

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Categorize items by warranty status
      const reportData = items.map((item) => {
        const expiryDate = new Date(item.warrantyExpiration!);
        const daysRemaining = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let status: 'expired' | 'expiring_soon' | 'valid';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= 30) {
          status = 'expiring_soon';
        } else {
          status = 'valid';
        }

        return {
          id: item.id,
          assetId: item.assetId,
          name: item.name,
          category: item.category,
          warrantyExpiry: item.warrantyExpiration!.toISOString(),
          daysRemaining,
          status,
        };
      });

      // Calculate totals
      const totalExpired = reportData.filter((i) => i.status === 'expired').length;
      const totalExpiringSoon = reportData.filter((i) => i.status === 'expiring_soon').length;
      const totalValid = reportData.filter((i) => i.status === 'valid').length;

      const response: ApiResponse<{
        items: typeof reportData;
        totalExpired: number;
        totalExpiringSoon: number;
        totalValid: number;
      }> = {
        success: true,
        data: {
          items: reportData,
          totalExpired,
          totalExpiringSoon,
          totalValid,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /reports/employees - Employee equipment summary (detailed)
// =============================================================================

router.get(
  '/employees',
  requirePermission('reports:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await prisma.employee.findMany({
        where: { isActive: true },
        orderBy: [{ department: 'asc' }, { lastName: 'asc' }],
        include: {
          assignments: {
            where: { returnedAt: null },
            include: {
              item: {
                select: {
                  assetId: true,
                  name: true,
                  category: true,
                  purchasePrice: true,
                },
              },
            },
          },
        },
      });

      const reportData = employees.map((emp) => {
        const totalValue = emp.assignments.reduce(
          (sum, a) => sum + Number(a.item.purchasePrice || 0),
          0
        );

        return {
          employeeId: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          department: emp.department,
          title: emp.title,
          activeAssignments: emp.assignments.length,
          totalEquipmentValue: totalValue.toFixed(2),
          equipment: emp.assignments.map((a) => ({
            assetId: a.item.assetId,
            name: a.item.name,
            category: a.item.category,
            value: Number(a.item.purchasePrice || 0).toFixed(2),
            assignedAt: a.assignedAt,
          })),
        };
      });

      const response: ApiResponse<{
        generatedAt: string;
        totalEmployees: number;
        employees: typeof reportData;
      }> = {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          totalEmployees: reportData.length,
          employees: reportData,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// Helper: Convert to CSV
// =============================================================================

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export { router as reportsRoutes };
