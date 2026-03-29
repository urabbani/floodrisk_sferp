/**
 * Authentication types for the flood risk application
 */

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API response wrapper for auth endpoints
export interface AuthApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// User list response for admin
export interface UserListResponse {
  users: AuthUser[];
}

// Create user request (admin only)
export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  role?: UserRole;
}

// Update user request (admin only)
export interface UpdateUserRequest {
  displayName?: string;
  role?: UserRole;
  active?: boolean;
}

// Reset password request (admin only)
export interface ResetPasswordRequest {
  password: string;
}
