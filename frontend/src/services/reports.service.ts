// Reports Service - API hooks for report generation
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { ReportFilters } from '../components/reports/ReportFilters';

// =============================================================================
// Types
// =============================================================================

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
    assignedAt: string;
    returnedAt: string | null;
    duration: number | null;
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
      assignedAt: string;
    }[];
  }[];
}

export interface WarrantyStatusReport {
  items: {
    id: string;
    assetId: string;
    name: string;
    category: string;
    warrantyExpiry: string;
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
    purchaseDate: string;
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
// Report Hooks
// =============================================================================

export function useInventorySummary(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'inventory-summary', filters],
    queryFn: async (): Promise<InventorySummaryReport> => {
      const response = await apiClient.get<InventorySummaryReport>(
        '/reports/inventory-summary',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAssignmentHistory(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'assignment-history', filters],
    queryFn: async (): Promise<AssignmentHistoryReport> => {
      const response = await apiClient.get<AssignmentHistoryReport>(
        '/reports/assignment-history',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useEquipmentByEmployee(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'equipment-by-employee', filters],
    queryFn: async (): Promise<EquipmentByEmployeeReport> => {
      const response = await apiClient.get<EquipmentByEmployeeReport>(
        '/reports/equipment-by-employee',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useWarrantyStatus(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'warranty-status', filters],
    queryFn: async (): Promise<WarrantyStatusReport> => {
      const response = await apiClient.get<WarrantyStatusReport>(
        '/reports/warranty-status',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDepreciationReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'depreciation', filters],
    queryFn: async (): Promise<DepreciationReport> => {
      const response = await apiClient.get<DepreciationReport>(
        '/reports/depreciation',
        { params: filters }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// =============================================================================
// Export Functions
// =============================================================================

export async function exportReportCSV(reportType: string, filters: ReportFilters = {}) {
  const response = await apiClient.get(`/reports/${reportType}/export`, {
    params: { ...filters, format: 'csv' },
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReportExcel(reportType: string, filters: ReportFilters = {}) {
  const response = await apiClient.get(`/reports/${reportType}/export`, {
    params: { ...filters, format: 'xlsx' },
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
