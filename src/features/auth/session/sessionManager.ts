import { getAuthApi } from '../api/authApi';
import { AuthError, AuthTokens, SessionResponse } from '../api/types';

const REFRESH_TOKEN_KEY = 'citaclara_refresh_token';

let memoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  memoryAccessToken = tokens.accessToken;
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // sessionStorage not available
  }
}

export function clearSession(): void {
  memoryAccessToken = null;
  try {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function hasSession(): boolean {
  return !!memoryAccessToken || !!getRefreshToken();
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Prevents multiple simultaneous refreshes by sharing the in-flight promise.
 */
export async function refreshSession(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  refreshPromise = (async () => {
    try {
      const api = getAuthApi();
      const newTokens = await api.refresh(refreshToken);
      saveTokens(newTokens);
      return newTokens.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Retrieves the current session with auto-refresh on 401.
 * If 401, tries one refresh, then retries once. On failure, clears session.
 */
export async function getCurrentSession(): Promise<SessionResponse | null> {
  const api = getAuthApi();

  // If we have no access token but have a refresh token, try to refresh first
  if (!memoryAccessToken) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      return null;
    }
  }

  try {
    const session = await api.getSession(memoryAccessToken!);
    return session;
  } catch (err: unknown) {
    // Solo un 401 justifica refrescar; un fallo de red no debe cerrar la sesión.
    if (!(err instanceof AuthError) || err.status !== 401) {
      throw err;
    }
    const refreshed = await refreshSession();
    if (refreshed) {
      try {
        const session = await api.getSession(refreshed);
        return session;
      } catch {
        clearSession();
        return null;
      }
    } else {
      clearSession();
      return null;
    }
  }
}

export async function logoutSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  const api = getAuthApi();

  if (refreshToken) {
    try {
      await api.logout(refreshToken);
    } catch {
      // Ignore network errors on logout
    }
  }

  clearSession();
}
