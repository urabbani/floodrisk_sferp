/**
 * Centralized API Client with Authentication
 *
 * Provides a fetch wrapper that automatically injects the JWT Bearer token
 * and handles 401 responses by clearing the token and triggering re-login.
 */

const TOKEN_KEY = 'floodrisk_auth_token';
const USERNAME_KEY = 'floodrisk_username'; // Legacy key, to be cleaned up

/**
 * Get stored JWT token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage (logout)
 */
export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  // Also clean up the legacy username key
  localStorage.removeItem(USERNAME_KEY);
}

/**
 * Custom event for auth state changes
 */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

/**
 * Dispatch auth logout event
 */
function dispatchLogoutEvent(): void {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

/**
 * API fetch options with optional noAuth flag
 */
export interface ApiFetchOptions extends RequestInit {
  /** If true, skip adding auth header (for public endpoints) */
  noAuth?: boolean;
}

/**
 * Centralized fetch wrapper with automatic auth token injection
 *
 * @param url - The API endpoint URL
 * @param options - Fetch options with optional noAuth flag
 * @returns Parsed JSON response
 * @throws Error on 401 or non-OK responses
 */
export async function apiFetch<T>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { noAuth, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // Add auth header unless noAuth is true
  if (!noAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set Content-Type for request bodies (unless already set)
  if (rest.body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    removeStoredToken();
    dispatchLogoutEvent();
    throw new Error('Session expired. Please log in again.');
  }

  // Handle other error responses
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing error JSON fails, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Helper for GET requests
 */
export function apiGet<T>(url: string, noAuth = false): Promise<T> {
  return apiFetch<T>(url, { method: 'GET', noAuth });
}

/**
 * Helper for POST requests
 */
export function apiPost<T>(url: string, body: unknown, noAuth = false): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
    noAuth,
  });
}

/**
 * Helper for PUT requests
 */
export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Helper for DELETE requests
 */
export function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' });
}
