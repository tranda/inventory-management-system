// Employees Service - API hooks for employee operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// =============================================================================
// Types
// =============================================================================

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  hireDate: string | null;
  isActive: boolean;
  managerId: string | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    assignments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreateInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  hireDate?: string;
  managerId?: string;
}

export interface EmployeeUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  managerId?: string | null;
}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  department?: string;
  isActive?: boolean;
}

// =============================================================================
// Query Keys
// =============================================================================

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (query: EmployeeListQuery) => [...employeeKeys.lists(), query] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  departments: () => [...employeeKeys.all, 'departments'] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch paginated list of employees
 */
export function useEmployees(query: EmployeeListQuery = {}) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: async () => {
      const response = await api.getPaginated<Employee>('/employees', {
        params: query as Record<string, string | number | boolean | undefined>,
      });
      return response;
    },
  });
}

/**
 * Fetch single employee by ID
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Employee>(`/employees/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch all departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: employeeKeys.departments(),
    queryFn: async () => {
      const response = await api.get<string[]>('/employees/departments');
      return response.data;
    },
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmployeeCreateInput) => {
      const response = await api.post<Employee>('/employees', data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

/**
 * Update an existing employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeUpdateInput }) => {
      const response = await api.patch<Employee>(`/employees/${id}`, data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.setQueryData(employeeKeys.detail(data.id), data);
    },
  });
}

/**
 * Deactivate an employee
 */
export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Employee>(`/employees/${id}/deactivate`, {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.setQueryData(employeeKeys.detail(data.id), data);
    },
  });
}

/**
 * Reactivate an employee
 */
export function useReactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Employee>(`/employees/${id}/reactivate`, {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.setQueryData(employeeKeys.detail(data.id), data);
    },
  });
}
