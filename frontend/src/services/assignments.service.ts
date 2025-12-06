// Assignments Service - API hooks for assignment operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { itemKeys } from './items.service';

// =============================================================================
// Types
// =============================================================================

export interface Assignment {
  id: string;
  itemId: string;
  employeeId: string;
  assignedById: string;
  assignedAt: string;
  expectedReturnDate: string | null;
  returnedAt: string | null;
  returnedById: string | null;
  returnCondition: string | null;
  returnNotes: string | null;
  notes: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  item?: {
    id: string;
    assetId: string;
    name: string;
    category: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    thumbnailUrl?: string | null;
    status?: string;
    condition?: string;
  };
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string | null;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  returnedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentCreateInput {
  itemId: string;
  employeeId: string;
  notes?: string;
  expectedReturnDate?: string;
  acknowledged?: boolean;
}

export interface AssignmentReturnInput {
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
  returnNotes?: string;
}

export interface AssignmentTransferInput {
  newEmployeeId: string;
  transferNotes?: string;
}

export interface AssignmentListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  itemId?: string;
  employeeId?: string;
  isActive?: boolean;
}

// =============================================================================
// Query Keys
// =============================================================================

export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (query: AssignmentListQuery) => [...assignmentKeys.lists(), query] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  stats: () => [...assignmentKeys.all, 'stats'] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch paginated list of assignments
 */
export function useAssignments(query: AssignmentListQuery = {}) {
  return useQuery({
    queryKey: assignmentKeys.list(query),
    queryFn: async () => {
      const response = await api.getPaginated<Assignment>('/assignments', {
        params: query as Record<string, string | number | boolean | undefined>,
      });
      return response;
    },
  });
}

/**
 * Fetch single assignment by ID
 */
export function useAssignment(id: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Assignment>(`/assignments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch assignment statistics
 */
export function useAssignmentStats() {
  return useQuery({
    queryKey: assignmentKeys.stats(),
    queryFn: async () => {
      const response = await api.get<{
        activeAssignments: number;
        returnedToday: number;
        pendingAcknowledgment: number;
      }>('/assignments/stats');
      return response.data;
    },
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new assignment
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignmentCreateInput) => {
      const response = await api.post<Assignment>('/assignments', data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

/**
 * Return an assignment
 */
export function useReturnAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignmentReturnInput }) => {
      const response = await api.put<Assignment>(`/assignments/${id}/return`, data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.setQueryData(assignmentKeys.detail(data.id), data);
    },
  });
}

/**
 * Transfer an assignment to another employee
 */
export function useTransferAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignmentTransferInput }) => {
      const response = await api.post<Assignment>(`/assignments/${id}/transfer`, data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

/**
 * Acknowledge an assignment
 */
export function useAcknowledgeAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Assignment>(`/assignments/${id}/acknowledge`, {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.setQueryData(assignmentKeys.detail(data.id), data);
    },
  });
}
