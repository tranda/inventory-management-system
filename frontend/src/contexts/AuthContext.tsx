// Auth Context - Constitution Art. 5.1: JWT authentication
// Provides authentication state and methods throughout the app

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, ApiClientError } from '../lib/api';
import type { User, LoginCredentials, LoginResponse, UserRole } from '../types/auth';

// =============================================================================
// Types
// =============================================================================

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Role hierarchy
const ROLE_HIERARCHY: UserRole[] = ['VIEWER', 'MANAGER', 'ADMIN'];

// =============================================================================
// Provider
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.role === role;
    },
    [user]
  );

  /**
   * Check if user has at least the specified role
   */
  const hasMinimumRole = useCallback(
    (minimumRole: UserRole): boolean => {
      if (!user) return false;
      const userIndex = ROLE_HIERARCHY.indexOf(user.role);
      const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);
      return userIndex >= minimumIndex;
    },
    [user]
  );

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    setUser(response.data.user);
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors, we're logging out anyway
    }
    setUser(null);
  }, []);

  /**
   * Refresh authentication by checking current session
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
    } catch (error) {
      // If unauthorized, try to refresh token
      if (error instanceof ApiClientError && error.isUnauthorized()) {
        try {
          await api.post('/auth/refresh');
          const response = await api.get<User>('/auth/me');
          setUser(response.data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, []);

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        await refreshAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshAuth]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
    hasRole,
    hasMinimumRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// =============================================================================
// Permission Helpers
// =============================================================================

export function useHasPermission() {
  const { user, hasMinimumRole } = useAuth();

  return {
    canManageItems: hasMinimumRole('MANAGER'),
    canManageEmployees: hasMinimumRole('MANAGER'),
    canManageAssignments: hasMinimumRole('MANAGER'),
    canViewReports: hasMinimumRole('MANAGER'),
    canManageUsers: hasMinimumRole('ADMIN'),
    canViewAudit: hasMinimumRole('ADMIN'),
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    isViewer: user?.role === 'VIEWER',
  };
}
