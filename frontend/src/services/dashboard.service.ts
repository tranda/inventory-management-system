// Dashboard Service - API hooks for dashboard data
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// =============================================================================
// Types
// =============================================================================

interface DashboardStats {
  totalItems: number;
  availableItems: number;
  assignedItems: number;
  inRepairItems: number;
  totalEmployees: number;
  activeAssignments: number;
  overdueReturns: number;
  expiringWarranties: number;
}

interface DueSoonItem {
  id: string;
  item: {
    id: string;
    assetId: string;
    name: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  expectedReturnAt: string;
  daysRemaining: number;
}

interface WarrantyItem {
  id: string;
  assetId: string;
  name: string;
  category: string;
  warrantyExpiry: string;
  daysRemaining: number;
  status: 'expired' | 'expiring_soon' | 'valid';
}

interface AuditLogEntry {
  id: string;
  entityType: 'Item' | 'Assignment' | 'Employee' | 'User';
  action: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  metadata?: Record<string, unknown>;
}

interface DashboardData {
  stats: DashboardStats;
  dueSoon: DueSoonItem[];
  warrantyAlerts: WarrantyItem[];
  recentActivity: AuditLogEntry[];
}

// =============================================================================
// Dashboard Hook
// =============================================================================

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await apiClient.get<DashboardData>('/dashboard');
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// =============================================================================
// Individual Dashboard Queries
// =============================================================================

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useDueSoon(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'due-soon', limit],
    queryFn: async (): Promise<DueSoonItem[]> => {
      const response = await apiClient.get<DueSoonItem[]>('/dashboard/due-soon', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useWarrantyAlerts(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'warranty-alerts', limit],
    queryFn: async (): Promise<WarrantyItem[]> => {
      const response = await apiClient.get<WarrantyItem[]>('/dashboard/warranty-alerts', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const response = await apiClient.get<AuditLogEntry[]>('/dashboard/recent-activity', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
