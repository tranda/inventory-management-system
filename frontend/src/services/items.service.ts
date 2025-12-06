// Items Service - API hooks for item operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Item, ItemCreateInput, ItemUpdateInput, ItemListQuery } from '../types/item';

// =============================================================================
// Query Keys
// =============================================================================

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (query: ItemListQuery) => [...itemKeys.lists(), query] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch paginated list of items
 */
export function useItems(query: ItemListQuery = {}) {
  return useQuery({
    queryKey: itemKeys.list(query),
    queryFn: async () => {
      const response = await api.getPaginated<Item>('/items', { params: query as Record<string, string | number | boolean | undefined> });
      return response;
    },
  });
}

/**
 * Fetch single item by ID
 */
export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Item>(`/items/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new item
 */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ItemCreateInput) => {
      const response = await api.post<Item>('/items', data as unknown as Record<string, unknown>);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

/**
 * Update an existing item
 */
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ItemUpdateInput }) => {
      const response = await api.patch<Item>(`/items/${id}`, data as Record<string, unknown>);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.setQueryData(itemKeys.detail(data.id), data);
    },
  });
}

/**
 * Delete an item (soft delete)
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

/**
 * Bulk delete items
 */
export function useBulkDeleteItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post<{ message: string; count: number }>('/items/bulk-delete', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

/**
 * Change item status
 */
export function useChangeItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const response = await api.post<Item>(`/items/${id}/status`, { status, reason });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.setQueryData(itemKeys.detail(data.id), data);
    },
  });
}

/**
 * Decommission an item
 */
export function useDecommissionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post<Item>(`/items/${id}/decommission`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.setQueryData(itemKeys.detail(data.id), data);
    },
  });
}

/**
 * Upload item photo
 */
export function useUploadItemPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const response = await api.upload<Item>(`/items/${id}/photo`, file);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.setQueryData(itemKeys.detail(data.id), data);
    },
  });
}
