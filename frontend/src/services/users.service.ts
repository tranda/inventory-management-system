// Users Service - API hooks for user management (Admin only)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// =============================================================================
// Types
// =============================================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assignmentsMade: number;
    returnsProcessed: number;
    auditLogs: number;
  };
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserUpdateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Role options for forms
export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'ADMIN', label: 'Administrator', description: 'Full system access including user management' },
  { value: 'MANAGER', label: 'Manager', description: 'Can manage inventory and view reports' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access to inventory' },
];

// =============================================================================
// Query Keys
// =============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (query: UserListQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch paginated list of users
 */
export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const response = await api.getPaginated<User>('/users', { params: query as unknown as Record<string, string | number | boolean | undefined> });
      return response;
    },
  });
}

/**
 * Fetch single user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserCreateInput) => {
      const response = await api.post<User>('/users', data as unknown as Record<string, unknown>);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserUpdateInput }) => {
      const response = await api.patch<User>(`/users/${id}`, data as unknown as Record<string, unknown>);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(data.id), data);
    },
  });
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Activate a user
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ message: string }>(`/users/${id}/activate`, {});
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

/**
 * Deactivate a user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<{ message: string }>(`/users/${id}/deactivate`, {});
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

/**
 * Reset user password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const response = await api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
      return response.data;
    },
  });
}
