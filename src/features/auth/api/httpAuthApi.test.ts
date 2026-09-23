import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpAuthApi } from './httpAuthApi';
import { AuthError } from './types';

const BASE_URL = 'http://localhost:8081';

function respondWith(status: number, body?: unknown): Response {
  if (body === undefined) {
    return new Response(null, { status });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json' },
  });
}

function stubFetch(response: Response | Error) {
  // Los parametros se declaran para que mock.calls quede tipado en las aserciones.
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HttpAuthApi', () => {
  it('envia el registro como JSON y devuelve el usuario creado', async () => {
    const created = { id: 7, email: 'ana@test.local', roles: ['USER'] };
    const fetchMock = stubFetch(
      new Response(JSON.stringify(created), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await new HttpAuthApi(BASE_URL).register({
      firstNames: 'Ana',
      lastNames: 'Prueba',
      documentType: 'CC',
      documentNumber: '90012345',
      email: 'ana@test.local',
      phone: '3001234567',
      password: 'Segura123',
    });

    expect(result).toEqual(created);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/api/auth/register`);
    expect(init.method).toBe('POST');
  });

  it('traduce un 409 de email duplicado a un error de campo', async () => {
    stubFetch(
      respondWith(409, {
        status: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
        detail: 'El email ya esta registrado.',
      }),
    );

    const error = await new HttpAuthApi(BASE_URL)
      .register({
        firstNames: 'Ana',
        lastNames: 'Prueba',
        documentType: 'CC',
        documentNumber: '90012345',
        email: 'ana@test.local',
        phone: '3001234567',
        password: 'Segura123',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AuthError);
    const authError = error as AuthError;
    expect(authError.status).toBe(409);
    expect(authError.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect(authError.fieldErrors.email).toBeDefined();
  });

  it('conserva los errores por campo de una validacion 400', async () => {
    stubFetch(
      respondWith(400, {
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Datos invalidos.',
        errors: [
          { field: 'email', message: 'Formato invalido.' },
          { field: 'password', message: 'Minimo 8 caracteres.' },
        ],
      }),
    );

    const error = (await new HttpAuthApi(BASE_URL)
      .login({ email: 'no-es-email', password: 'x' })
      .catch((e: unknown) => e)) as AuthError;

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors).toEqual({
      email: 'Formato invalido.',
      password: 'Minimo 8 caracteres.',
    });
  });

  it('convierte un fallo de red en NETWORK_ERROR sin exponer el error original', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    const error = (await new HttpAuthApi(BASE_URL)
      .login({ email: 'ana@test.local', password: 'Segura123' })
      .catch((e: unknown) => e)) as AuthError;

    expect(error).toBeInstanceOf(AuthError);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.status).toBe(0);
  });

  it('resuelve el logout con 204 sin cuerpo', async () => {
    stubFetch(respondWith(204));

    await expect(new HttpAuthApi(BASE_URL).logout('un-refresh-token')).resolves.toBeUndefined();
  });

  it('envia el access token como Bearer al consultar la sesion', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ userId: 1, email: 'ana@test.local', roles: ['USER'] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await new HttpAuthApi(BASE_URL).getSession('un-access-token');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer un-access-token');
  });

  it('elimina las barras finales de la URL base', async () => {
    const fetchMock = stubFetch(respondWith(204));

    await new HttpAuthApi(`${BASE_URL}///`).logout('un-refresh-token');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${BASE_URL}/api/auth/logout`);
  });
});
