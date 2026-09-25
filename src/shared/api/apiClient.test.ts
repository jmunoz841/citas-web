import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, setExpiredSessionListener } from './apiClient';
import { ApiError } from './errors';
import { mockApi, problem, signIn, signOut } from '../../test/apiTestUtils';
import { getAccessToken, getRefreshToken } from '../../features/auth/session/sessionManager';

afterEach(() => {
  vi.unstubAllGlobals();
  setExpiredSessionListener(null);
  signOut();
});

const tokens = (access: string, refresh: string) => ({
  body: { tokenType: 'Bearer', accessToken: access, expiresIn: 900, refreshToken: refresh, refreshExpiresIn: 604800 },
});

describe('apiRequest', () => {
  it('envía el access token y omite los parámetros vacíos de la consulta', async () => {
    signIn();
    const calls = mockApi({ 'GET /api/v1/availability': { body: { items: [] } } });

    await apiRequest('/api/v1/availability', { query: { date: '2026-09-26', siteCode: '', specialtyId: undefined } });

    expect(calls[0].query.get('date')).toBe('2026-09-26');
    expect(calls[0].query.has('siteCode')).toBe(false);
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-access');
  });

  it('ante un 401 refresca una vez, rota el refresh token y reintenta', async () => {
    signIn();
    let attempts = 0;
    mockApi({
      'GET /api/v1/professional/me': () => (++attempts === 1 ? problem(401, 'UNAUTHORIZED') : { body: { id: 1 } }),
      'POST /api/v1/auth/refresh': tokens('nuevo-access', 'nuevo-refresh'),
    });

    const me = await apiRequest<{ id: number }>('/api/v1/professional/me');

    expect(me.id).toBe(1);
    expect(getAccessToken()).toBe('nuevo-access');
    expect(getRefreshToken()).toBe('nuevo-refresh');
  });

  it('si el refresh también falla avisa que la sesión expiró', async () => {
    signIn();
    const expired = vi.fn();
    setExpiredSessionListener(expired);
    mockApi({
      'GET /api/v1/professional/me': problem(401, 'UNAUTHORIZED'),
      'POST /api/v1/auth/refresh': problem(401, 'INVALID_REFRESH_TOKEN'),
    });

    await expect(apiRequest('/api/v1/professional/me')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledOnce();
  });

  it('traduce el ProblemDetail a ApiError con errores por campo', async () => {
    signIn();
    mockApi({
      'POST /api/v1/admin/appointments/7/reject': problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'reason', message: 'El motivo del rechazo es obligatorio' },
      ]),
    });

    const error = await apiRequest('/api/v1/admin/appointments/7/reject', { method: 'POST', body: { reason: '' } }).catch((e: ApiError) => e) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors.reason).toBe('El motivo del rechazo es obligatorio');
  });

  it('un fallo de red no cierra la sesión', async () => {
    signIn();
    const expired = vi.fn();
    setExpiredSessionListener(expired);
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));

    const error = await apiRequest('/api/v1/professional/me').catch((e: ApiError) => e) as ApiError;

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.isConnectionProblem).toBe(true);
    expect(expired).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('test-access');
  });
});
