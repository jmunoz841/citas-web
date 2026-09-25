import { getAccessToken, refreshSession } from '../../features/auth/session/sessionManager';
import { apiBaseUrl } from './config';
import { ApiError, CONNECTION_ERROR_MESSAGE, ProblemDetails } from './errors';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Parámetros de consulta; los valores vacíos o indefinidos se omiten. */
  query?: Record<string, string | number | undefined | null>;
  /** `false` para endpoints públicos (catálogos). */
  auth?: boolean;
}

type ExpiredSessionListener = () => void;
let onExpiredSession: ExpiredSessionListener | null = null;

/** La sesión registra aquí cómo reaccionar cuando el refresh token ya no sirve (volver a `/login`). */
export function setExpiredSessionListener(listener: ExpiredSessionListener | null): void {
  onExpiredSession = listener;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = apiBaseUrl().replace(/\/+$/, '');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return `${base}${path}${qs ? `?${qs}` : ''}`;
}

async function toApiError(res: Response): Promise<ApiError> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    try {
      const problem = (await res.json()) as ProblemDetails;
      if (problem && problem.code) {
        return new ApiError({ ...problem, status: problem.status ?? res.status });
      }
    } catch {
      // cuerpo ilegible: se cae al error genérico
    }
  }
  if (res.status === 401) {
    return new ApiError({ status: 401, code: 'UNAUTHORIZED', detail: 'No autorizado.' });
  }
  if (res.status === 403) {
    return new ApiError({ status: 403, code: 'FORBIDDEN', detail: 'No tienes permiso para esta acción.' });
  }
  if (res.status >= 500) {
    return new ApiError({ status: res.status, code: 'SERVER_ERROR', detail: CONNECTION_ERROR_MESSAGE });
  }
  return new ApiError({
    status: res.status,
    code: 'HTTP_ERROR',
    detail: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
  });
}

async function send(url: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', detail: CONNECTION_ERROR_MESSAGE });
  }
}

/**
 * Llamada a `citas-api`. Con `auth` (por defecto) envía el access token y, si la API responde
 * 401, refresca una vez y reintenta. Si el refresh falla, la sesión expiró: se avisa al
 * listener y se lanza el 401. Los errores de red o 5xx **no** cierran la sesión.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  const auth = options.auth ?? true;

  let token = auth ? getAccessToken() : null;
  if (auth && !token) {
    token = await refreshSession();
    if (!token) {
      onExpiredSession?.();
      throw new ApiError({ status: 401, code: 'UNAUTHORIZED', detail: 'No autorizado.' });
    }
  }

  let res = await send(url, options, token);
  if (auth && res.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      onExpiredSession?.();
      throw await toApiError(res);
    }
    res = await send(url, options, refreshed);
  }

  if (!res.ok) {
    throw await toApiError(res);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/** Envoltorio `{ items: [...] }` que usan todos los listados de la API. */
export interface ItemsResponse<T> {
  items: T[];
}
