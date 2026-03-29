/**
 * Authentication Context and Hook
 *
 * Provides React context for authentication state, login/logout functions,
 * and the current user. Wraps the application with AuthProvider.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, LoginRequest } from '@/types/auth';
import { apiFetch, getStoredToken, setStoredToken, removeStoredToken, AUTH_LOGOUT_EVENT } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 *
 * Wraps the app and provides auth context to all children.
 * Validates stored token on mount via /api/auth/me.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => !getStoredToken()); // Skip loading if no token

  // On mount, check if there's a stored token and validate it
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    let mounted = true;

    // Validate token by calling /api/auth/me
    apiFetch<{ success: boolean; data: AuthUser }>('/api/auth/me', { noAuth: false })
      .then((res) => {
        if (mounted && res.success && res.data) {
          setUser(res.data);
        }
      })
      .catch(() => {
        // Token invalid or expired, clear it
        if (mounted) {
          removeStoredToken();
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth:logout events from api.ts (triggered on 401 responses)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, []);

  /**
   * Login with username and password
   */
  const login = useCallback(async (credentials: LoginRequest) => {
    const res = await apiFetch<{
      success: boolean;
      data: { token: string; user: AuthUser };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      noAuth: true,
    });

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Login failed');
    }

    setStoredToken(res.data.token);
    setUser(res.data.user);
  }, []);

  /**
   * Logout - clear token and user state
   */
  const logout = useCallback(() => {
    removeStoredToken();
    setUser(null);
  }, []);

  /**
   * Refresh current user data from server
   */
  const refreshUser = useCallback(async () => {
    const res = await apiFetch<{ success: boolean; data: AuthUser }>('/api/auth/me');
    if (res.success && res.data) {
      setUser(res.data);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Access auth context from any component.
 * Must be used within an AuthProvider.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
/* eslint-disable react-refresh/only-export-components */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
