// Audit Service - API hooks for audit log queries
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

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

export interface AuditLogEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: {
    ipAddress: string;
    userAgent: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface AuditLogQuery {
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Hooks
// =============================================================================

export function useAuditLogs(query: AuditLogQuery = {}) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: async (): Promise<AuditLogResponse> => {
      const response = await apiClient.get<AuditLogResponse>('/audit-logs', {
        params: query,
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useEntityAuditHistory(entityType: EntityType, entityId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const response = await apiClient.get<AuditLogEntry[]>(
        `/audit-logs/entity/${entityType}/${entityId}`
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId,
  });
}

// =============================================================================
// Constants
// =============================================================================

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  Item: 'Item',
  Assignment: 'Assignment',
  Employee: 'Employee',
  User: 'User',
};

export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  ASSIGN: 'Assigned',
  RETURN: 'Returned',
  TRANSFER: 'Transferred',
  STATUS_CHANGE: 'Status Changed',
  DECOMMISSION: 'Decommissioned',
  LOGIN: 'Logged In',
  LOGOUT: 'Logged Out',
  PASSWORD_CHANGE: 'Password Changed',
};

export const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  ASSIGN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  RETURN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  TRANSFER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  STATUS_CHANGE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  DECOMMISSION: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  LOGIN: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  PASSWORD_CHANGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
};
