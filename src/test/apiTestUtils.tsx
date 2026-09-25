import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ToastProvider } from '../shared/components/Toast';
import { clearSession, saveTokens } from '../features/auth/session/sessionManager';
import { SessionProvider } from '../features/auth/session/SessionContext';

export interface FakeResponse {
  status?: number;
  body?: unknown;
}

type Handler = FakeResponse | ((request: { url: URL; method: string; body: unknown }) => FakeResponse);

export interface RecordedCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

/**
 * Sustituye `fetch` por una API falsa. Las claves son `"MÉTODO /ruta"` (sin query), p. ej.
 * `'POST /api/v1/admin/appointments/7/approve'`. Una ruta no registrada responde 404 y falla
 * la prueba de forma visible. Devuelve las llamadas recibidas, en orden.
 */
export function mockApi(routes: Record<string, Handler>): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = (init?.method ?? 'GET').toUpperCase();
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      calls.push({ method, path: url.pathname, query: url.searchParams, body });
      const handler = routes[`${method} ${url.pathname}`];
      if (!handler) {
        return new Response(JSON.stringify({ status: 404, code: 'NOT_FOUND', detail: `Sin mock: ${method} ${url.pathname}` }), {
          status: 404,
          headers: { 'content-type': 'application/problem+json' },
        });
      }
      const res = typeof handler === 'function' ? handler({ url, method, body }) : handler;
      const status = res.status ?? 200;
      if (status === 204) return new Response(null, { status });
      return new Response(JSON.stringify(res.body ?? {}), {
        status,
        headers: { 'content-type': status >= 400 ? 'application/problem+json' : 'application/json' },
      });
    }),
  );
  return calls;
}

/** Cuerpo ProblemDetail como el de `citas-api`. */
export function problem(status: number, code: string, detail = 'Error', errors?: { field: string; message: string }[]): FakeResponse {
  return { status, body: { status, code, detail, errors } };
}

/** Deja una sesión con access token en memoria para que `apiRequest` no intente refrescar. */
export function signIn(): void {
  saveTokens({ tokenType: 'Bearer', accessToken: 'test-access', expiresIn: 900, refreshToken: 'test-refresh', refreshExpiresIn: 604800 });
}

export function signOut(): void {
  clearSession();
}

/**
 * Renderiza con router en memoria y toasts. `withSession` añade el `SessionProvider` (entonces
 * hay que mockear `GET /api/v1/auth/session`).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', withSession = false }: { route?: string; withSession?: boolean } = {},
): RenderResult {
  const content = <ToastProvider>{ui}</ToastProvider>;
  return render(
    <MemoryRouter initialEntries={[route]}>{withSession ? <SessionProvider>{content}</SessionProvider> : content}</MemoryRouter>,
  );
}
