import { apiBaseUrl } from '../../../shared/api/config';
import { AuthApi } from './types';
import { HttpAuthApi } from './httpAuthApi';

let authApiInstance: AuthApi | null = null;

/**
 * Cliente de autenticación contra `citas-api`. Ya no existe modo simulado: en S3 el frontend
 * consume siempre la API real, y la falta de `VITE_API_URL` es un error visible en vez de una
 * caída silenciosa a datos falsos.
 */
export function getAuthApi(): AuthApi {
  if (!authApiInstance) {
    authApiInstance = new HttpAuthApi(apiBaseUrl());
  }

  return authApiInstance;
}

/** Reinicia el singleton. Solo para pruebas. */
export function resetAuthApi(): void {
  authApiInstance = null;
}
