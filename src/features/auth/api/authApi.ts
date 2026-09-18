import { AuthApi } from './types';
import { HttpAuthApi } from './httpAuthApi';
import { MockAuthApi } from './mockAuthApi';

function getAuthMode(): 'api' | 'mock' {
  const envMode = import.meta.env.VITE_AUTH_MODE as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (envMode === 'mock') {
    return 'mock';
  }

  if (envMode === 'api') {
    // If explicitly set to api but no URL is provided, fall back to mock to avoid crashing
    return apiUrl ? 'api' : 'mock';
  }

  // Default rule: "mock" when VITE_API_URL is not set, otherwise "api"
  return apiUrl && apiUrl.trim().length > 0 ? 'api' : 'mock';
}

let authApiInstance: AuthApi | null = null;

export function getAuthApi(): AuthApi {
  if (!authApiInstance) {
    const mode = getAuthMode();
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (mode === 'api' && apiUrl) {
      authApiInstance = new HttpAuthApi(apiUrl);
    } else {
      authApiInstance = new MockAuthApi();
    }
  }

  return authApiInstance;
}

// Reset instance helper (useful for testing or dynamic switching)
export function resetAuthApi(): void {
  authApiInstance = null;
}
