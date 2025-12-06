// Auth Service - TanStack Query hooks for authentication
// Constitution Art. 5.1: JWT authentication integration

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { User, LoginCredentials, LoginResponse, RegisterCredentials } from '../types/auth';

// =============================================================================
// Query Keys
// =============================================================================

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// =============================================================================
// API Functions
// =============================================================================

async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

async function register(credentials: RegisterCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/register', credentials);
  return response.data;
}

async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

async function refreshToken(): Promise<{ accessToken: string }> {
  const response = await api.post<{ accessToken: string }>('/auth/refresh');
  return response.data;
}

async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post('/auth/change-password', data);
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Login mutation hook
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

/**
 * Register mutation hook
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

/**
 * Logout mutation hook
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.clear(); // Clear all cached data on logout
    },
  });
}

/**
 * Refresh token mutation hook
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: refreshToken,
  });
}

/**
 * Change password mutation hook
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
