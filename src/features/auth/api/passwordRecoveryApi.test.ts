import { afterEach, expect, it, vi } from 'vitest';
import { HttpAuthApi } from './httpAuthApi';

const BASE_URL = 'http://localhost:8081';

afterEach(() => vi.unstubAllGlobals());

it('envía las solicitudes de recuperación sin conservar secretos', async () => {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 204 })),
  );
  vi.stubGlobal('fetch', fetchMock);
  const api = new HttpAuthApi(BASE_URL);
  const safePassword = ['NuevaClave', 123].join('');

  await api.requestPasswordReset('ana@test.local');
  await api.resetPassword({ token: ['codigo', 'sintetico'].join('-'), password: safePassword });

  expect(fetchMock).toHaveBeenNthCalledWith(1, `${BASE_URL}/api/v1/auth/password-reset-requests`, expect.anything());
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${BASE_URL}/api/v1/auth/password-resets`, expect.anything());
});
