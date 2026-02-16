/**
 * Client-side auth state management.
 * Handles token storage, refresh, and authenticated fetch.
 */

import type { AuthUser, AuthTokens } from './sync/types';

const ACCESS_TOKEN_KEY = 'bible-access-token';
const REFRESH_TOKEN_KEY = 'bible-refresh-token';
const USER_KEY = 'bible-auth-user';

// In-memory cache to avoid parsing from localStorage every time
let cachedAccessToken: string | null = null;
let cachedUser: AuthUser | null = null;

/**
 * Store auth tokens after login.
 */
export function setAuthTokens(tokens: AuthTokens): void {
  cachedAccessToken = tokens.accessToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/**
 * Store user info after login.
 */
export function setAuthUser(user: AuthUser): void {
  cachedUser = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get the current user (from cache or localStorage).
 */
export function getAuthUser(): AuthUser | null {
  if (cachedUser) return cachedUser;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      cachedUser = JSON.parse(stored);
      return cachedUser;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Get the access token.
 */
export function getAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  cachedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  return cachedAccessToken;
}

/**
 * Get the refresh token.
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all auth state (logout).
 */
export function clearAuth(): void {
  cachedAccessToken = null;
  cachedUser = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is logged in.
 */
export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// Prevent concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh token is invalid - force logout
      clearAuth();
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.accessToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Authenticated fetch that automatically refreshes tokens on 401.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Try to refresh the token (deduplicate concurrent refreshes)
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    token = await refreshPromise;

    if (!token) throw new Error('Session expired');

    headers.set('Authorization', `Bearer ${token}`);
    res = await fetch(url, { ...options, headers });
  }

  return res;
}
