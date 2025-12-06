// Reports Service - Constitution Art. 4.2: Report generation
// Generates various inventory and assignment reports

import { prisma } from '../app.js';

// =============================================================================
// Types
// =============================================================================

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  department?: string;
  status?: string;
}

export interface InventorySummaryReport {
  totalItems: number;
  byCategory: { category: string; count: number; value: number }[];
  byStatus: { status: string; count: number }[];
  byCondition: { condition: string; count: number }[];
  totalValue: number;
  averageAge: number;
}

export interface AssignmentHistoryReport {
  assignments: {
    id: string;
    itemAssetId: string;
    itemName: string;
    employeeName: string;
    department: string;
    assignedAt: Date;
    returnedAt: Date | null;
    duration: number | null; // days
  }[];
  totalAssignments: number;
  averageDuration: number;
  activeAssignments: number;
}

export interface EquipmentByEmployeeReport {
  employees: {
    id: string;
    name: string;
    department: string;
    activeAssignments: number;
    totalHistorical: number;
    currentItems: {
      assetId: string;
      name: string;
      category: string;
      assignedAt: Date;
    }[];
  }[];
}

export interface WarrantyStatusReport {
  items: {
    id: string;
    assetId: string;
    name: string;
    category: string;
    warrantyExpiry: Date;
    daysRemaining: number;
    status: 'expired' | 'expiring_soon' | 'valid';
  }[];
  totalExpired: number;
  totalExpiringSoon: number;
  totalValid: number;
}

export interface DepreciationReport {
  items: {
    id: string;
    assetId: string;
    name: string;
    category: string;
    purchaseDate: Date;
    purchasePrice: number;
    currentValue: number;
    depreciationRate: number;
    ageYears: number;
  }[];
  totalOriginalValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
}

// =============================================================================
// Inventory Summary Report
// =============================================================================

export async function generateInventorySummary(
  filters: ReportFilters = {}
): Promise<InventorySummaryReport> {
  const where: Record<string, unknown> = { deletedAt: null };

  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;

  // Get total items
  const totalItems = await prisma.item.count({ where });

  // Group by category with value
  const byCategory = await prisma.item.groupBy({
    by: ['category'],
    where,
    _count: { id: true },
    _sum: { purchasePrice: true },
  });

  // Group by status
  const byStatus = await prisma.item.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  });

  // Group by condition
  const byCondition = await prisma.item.groupBy({
    by: ['condition'],
    where,
    _count: { id: true },
  });

  // Calculate total value
  const valueResult = await prisma.item.aggregate({
    where,
    _sum: { purchasePrice: true },
    _avg: { purchasePrice: true },
  });

  // Calculate average age
  const items = await prisma.item.findMany({
    where,
    select: { purchaseDate: true },
  });

  const now = new Date();
  const totalAge = items.reduce((sum, item) => {
    if (item.purchaseDate) {
      const ageMs = now.getTime() - new Date(item.purchaseDate).getTime();
      return sum + ageMs / (1000 * 60 * 60 * 24 * 365); // Convert to years
    }
    return sum;
  }, 0);

  const averageAge = items.length > 0 ? totalAge / items.length : 0;

  return {
    totalItems,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
      value: c._sum.purchasePrice || 0,
    })),
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    byCondition: byCondition.map((c) => ({
      condition: c.condition,
      count: c._count.id,
    })),
    totalValue: valueResult._sum.purchasePrice || 0,
    averageAge: Math.round(averageAge * 10) / 10,
  };
}

// =============================================================================
// Assignment History Report
// =============================================================================

export async function generateAssignmentHistory(
  filters: ReportFilters = {}
): Promise<AssignmentHistoryReport> {
  const where: Record<string, unknown> = {};

  if (filters.startDate) {
    where.assignedAt = { gte: filters.startDate };
  }
  if (filters.endDate) {
    where.assignedAt = { ...((where.assignedAt as object) || {}), lte: filters.endDate };
  }
  if (filters.department) {
    where.employee = { department: filters.department };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { assignedAt: 'desc' },
    include: {
      item: { select: { assetId: true, name: true } },
      employee: { select: { firstName: true, lastName: true, department: true } },
    },
  });

  const now = new Date();
  const assignmentsWithDuration = assignments.map((a) => {
    const endDate = a.returnedAt || now;
    const duration = Math.floor(
      (endDate.getTime() - new Date(a.assignedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: a.id,
      itemAssetId: a.item.assetId,
      itemName: a.item.name,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      department: a.employee.department || 'N/A',
      assignedAt: a.assignedAt,
      returnedAt: a.returnedAt,
      duration: a.returnedAt ? duration : null,
    };
  });

  const completedAssignments = assignmentsWithDuration.filter((a) => a.duration !== null);
  const totalDuration = completedAssignments.reduce((sum, a) => sum + (a.duration || 0), 0);
  const averageDuration =
    completedAssignments.length > 0 ? totalDuration / completedAssignments.length : 0;

  return {
    assignments: assignmentsWithDuration,
    totalAssignments: assignments.length,
    averageDuration: Math.round(averageDuration),
    activeAssignments: assignments.filter((a) => !a.returnedAt).length,
  };
}

// =============================================================================
// Equipment by Employee Report
// =============================================================================

export async function generateEquipmentByEmployee(
  filters: ReportFilters = {}
): Promise<EquipmentByEmployeeReport> {
  const where: Record<string, unknown> = { isActive: true };

  if (filters.department) {
    where.department = filters.department;
  }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { lastName: 'asc' },
    include: {
      assignments: {
        include: {
          item: {
            select: { assetId: true, name: true, category: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  return {
    employees: employees.map((emp) => {
      const activeAssignments = emp.assignments.filter((a) => !a.returnedAt);

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'N/A',
        activeAssignments: activeAssignments.length,
        totalHistorical: emp.assignments.length,
        currentItems: activeAssignments.map((a) => ({
          assetId: a.item.assetId,
          name: a.item.name,
          category: a.item.category,
          assignedAt: a.assignedAt,
        })),
      };
    }),
  };
}

// =============================================================================
// Warranty Status Report
// =============================================================================

export async function generateWarrantyStatus(
  filters: ReportFilters = {}
): Promise<WarrantyStatusReport> {
  const where: Record<string, unknown> = {
    deletedAt: null,
    warrantyExpiry: { not: null },
  };

  if (filters.category) where.category = filters.category;

  const items = await prisma.item.findMany({
    where,
    orderBy: { warrantyExpiry: 'asc' },
    select: {
      id: true,
      assetId: true,
      name: true,
      category: true,
      warrantyExpiry: true,
    },
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const itemsWithStatus = items.map((item) => {
    const expiryDate = new Date(item.warrantyExpiry!);
    const daysRemaining = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: 'expired' | 'expiring_soon' | 'valid';
    if (expiryDate < now) {
      status = 'expired';
    } else if (expiryDate < thirtyDaysFromNow) {
      status = 'expiring_soon';
    } else {
      status = 'valid';
    }

    return {
      id: item.id,
      assetId: item.assetId,
      name: item.name,
      category: item.category,
      warrantyExpiry: expiryDate,
      daysRemaining,
      status,
    };
  });

  return {
    items: itemsWithStatus,
    totalExpired: itemsWithStatus.filter((i) => i.status === 'expired').length,
    totalExpiringSoon: itemsWithStatus.filter((i) => i.status === 'expiring_soon').length,
    totalValid: itemsWithStatus.filter((i) => i.status === 'valid').length,
  };
}

// =============================================================================
// Depreciation Report
// =============================================================================

const DEPRECIATION_RATES: Record<string, number> = {
  LAPTOP: 0.33, // 3-year depreciation
  DESKTOP: 0.25, // 4-year depreciation
  MONITOR: 0.20, // 5-year depreciation
  PHONE: 0.50, // 2-year depreciation
  TABLET: 0.33, // 3-year depreciation
  PRINTER: 0.20, // 5-year depreciation
  NETWORK_EQUIPMENT: 0.14, // 7-year depreciation
  PERIPHERAL: 0.33, // 3-year depreciation
  OTHER: 0.20, // Default 5-year
};

export async function generateDepreciationReport(
  filters: ReportFilters = {}
): Promise<DepreciationReport> {
  const where: Record<string, unknown> = {
    deletedAt: null,
    purchaseDate: { not: null },
    purchasePrice: { not: null, gt: 0 },
  };

  if (filters.category) where.category = filters.category;

  const items = await prisma.item.findMany({
    where,
    orderBy: { purchaseDate: 'asc' },
    select: {
      id: true,
      assetId: true,
      name: true,
      category: true,
      purchaseDate: true,
      purchasePrice: true,
    },
  });

  const now = new Date();

  const itemsWithDepreciation = items.map((item) => {
    const purchaseDate = new Date(item.purchaseDate!);
    const ageYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationRate = DEPRECIATION_RATES[item.category] || DEPRECIATION_RATES.OTHER;

    // Calculate current value using straight-line depreciation
    // Value = Purchase Price * (1 - depreciation_rate * years)
    // Minimum value is 10% of purchase price (salvage value)
    const totalDepreciation = item.purchasePrice! * depreciationRate * ageYears;
    const minValue = item.purchasePrice! * 0.1;
    const currentValue = Math.max(item.purchasePrice! - totalDepreciation, minValue);

    return {
      id: item.id,
      assetId: item.assetId,
      name: item.name,
      category: item.category,
      purchaseDate,
      purchasePrice: item.purchasePrice!,
      currentValue: Math.round(currentValue * 100) / 100,
      depreciationRate,
      ageYears: Math.round(ageYears * 10) / 10,
    };
  });

  const totalOriginalValue = itemsWithDepreciation.reduce((sum, i) => sum + i.purchasePrice, 0);
  const totalCurrentValue = itemsWithDepreciation.reduce((sum, i) => sum + i.currentValue, 0);

  return {
    items: itemsWithDepreciation,
    totalOriginalValue,
    totalCurrentValue,
    totalDepreciation: totalOriginalValue - totalCurrentValue,
  };
}

// =============================================================================
// Export to CSV
// =============================================================================

export function convertToCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}
