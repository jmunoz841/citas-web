import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogsApi, CatalogsError } from './catalogsApi';

const BASE_URL = 'http://localhost:8081';

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CatalogsApi', () => {
  it('pide los tipos de documento al endpoint versionado y devuelve los items', async () => {
    const fetchMock = stubFetch(
      jsonResponse(200, {
        items: [
          { code: 'CC', name: 'Cédula de ciudadanía' },
          { code: 'PA', name: 'Pasaporte' },
        ],
      }),
    );

    const result = await new CatalogsApi(BASE_URL).documentTypes();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ code: 'CC', name: 'Cédula de ciudadanía' });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${BASE_URL}/api/v1/catalogs/document-types`);
  });

  it('no envia cabecera Authorization porque los catalogos son publicos', async () => {
    const fetchMock = stubFetch(jsonResponse(200, { items: [] }));

    await new CatalogsApi(BASE_URL).sites();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(init).toBeUndefined();
  });

  it('devuelve las sedes con su direccion', async () => {
    stubFetch(
      jsonResponse(200, {
        items: [{ code: 'HIC', name: 'Hospital Internacional de Colombia', address: 'Km 7 Autopista' }],
      }),
    );

    const [site] = await new CatalogsApi(BASE_URL).sites();

    expect(site.code).toBe('HIC');
    expect(site.address).toBe('Km 7 Autopista');
  });

  it('convierte un fallo de red en CatalogsError con estado 0', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    const error = (await new CatalogsApi(BASE_URL)
      .documentTypes()
      .catch((e: unknown) => e)) as CatalogsError;

    expect(error).toBeInstanceOf(CatalogsError);
    expect(error.status).toBe(0);
  });

  it('convierte un 500 en CatalogsError conservando el estado', async () => {
    stubFetch(jsonResponse(500, { detail: 'boom' }));

    const error = (await new CatalogsApi(BASE_URL).sites().catch((e: unknown) => e)) as CatalogsError;

    expect(error).toBeInstanceOf(CatalogsError);
    expect(error.status).toBe(500);
  });

  it('tolera una respuesta sin la clave items', async () => {
    stubFetch(jsonResponse(200, {}));

    await expect(new CatalogsApi(BASE_URL).regimes()).resolves.toEqual([]);
  });
});
