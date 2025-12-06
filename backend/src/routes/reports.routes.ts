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
// GET /reports/inventory - Full inventory report
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
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
          assignments: {
            where: { returnedAt: null },
            include: {
              employee: {
                select: { firstName: true, lastName: true, department: true },
              },
            },
            take: 1,
          },
        },
      });

      // Transform for report
      const reportData = items.map((item) => ({
        assetId: item.assetId,
        name: item.name,
        category: item.category,
        status: item.status,
        condition: item.condition,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        purchaseDate: item.purchaseDate,
        purchasePrice: item.purchasePrice,
        warrantyExpiration: item.warrantyExpiration,
        location: item.location,
        currentAssignee: item.assignments[0]
          ? `${item.assignments[0].employee.firstName} ${item.assignments[0].employee.lastName}`
          : null,
        assigneeDepartment: item.assignments[0]?.employee.department || null,
        createdAt: item.createdAt,
        createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
      }));

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
        res.send(csv);
        return;
      }

      const response: ApiResponse<{
        generatedAt: string;
        totalItems: number;
        items: typeof reportData;
      }> = {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          totalItems: reportData.length,
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
// GET /reports/assignments - Assignment history report
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
        orderBy: { assignedAt: 'desc' },
        include: {
          item: {
            select: {
              assetId: true,
              name: true,
              category: true,
              serialNumber: true,
            },
          },
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
          assignedBy: {
            select: { firstName: true, lastName: true },
          },
          returnedBy: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // Transform for report
      const reportData = assignments.map((a) => ({
        itemAssetId: a.item.assetId,
        itemName: a.item.name,
        itemCategory: a.item.category,
        itemSerialNumber: a.item.serialNumber,
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
        employeeEmail: a.employee.email,
        employeeDepartment: a.employee.department,
        assignedAt: a.assignedAt,
        assignedBy: `${a.assignedBy.firstName} ${a.assignedBy.lastName}`,
        expectedReturnAt: a.expectedReturnAt,
        returnedAt: a.returnedAt,
        returnedBy: a.returnedBy
          ? `${a.returnedBy.firstName} ${a.returnedBy.lastName}`
          : null,
        conditionAtAssignment: a.conditionAtAssignment,
        conditionAtReturn: a.conditionAtReturn,
        acknowledged: a.acknowledged,
        purpose: a.purpose,
      }));

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=assignments-report.csv');
        res.send(csv);
        return;
      }

      const response: ApiResponse<{
        generatedAt: string;
        totalAssignments: number;
        assignments: typeof reportData;
      }> = {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          totalAssignments: reportData.length,
          assignments: reportData,
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
// GET /reports/employees - Employee equipment summary
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
