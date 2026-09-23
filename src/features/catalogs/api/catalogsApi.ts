import { apiBaseUrl } from '../../../shared/api/config';

/** Entrada de catálogo con código y nombre: tipos de documento, regímenes y roles. */
export interface CatalogEntry {
  code: string;
  name: string;
}

export interface Site {
  code: string;
  name: string;
  address: string;
}

export interface StatusEntry {
  code: string;
  name: string;
  terminal: boolean;
}

interface ItemsResponse<T> {
  items: T[];
}

export class CatalogsError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'CatalogsError';
    this.status = status;
  }
}

/**
 * Catálogos fijos de `citas-api` (HU-005). Son públicos, así que no llevan token.
 * Contrato: `citas-api/docs/contratos/catalogos.md`.
 */
export class CatalogsApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string = apiBaseUrl()) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async fetchItems<T>(path: string): Promise<T[]> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/v1/catalogs/${path}`);
    } catch {
      throw new CatalogsError(0, 'No pudimos conectar con el servidor. Inténtalo de nuevo.');
    }

    if (!response.ok) {
      throw new CatalogsError(response.status, 'No pudimos cargar la información. Inténtalo de nuevo.');
    }

    const body = (await response.json()) as ItemsResponse<T>;
    return body.items ?? [];
  }

  documentTypes(): Promise<CatalogEntry[]> {
    return this.fetchItems<CatalogEntry>('document-types');
  }

  sites(): Promise<Site[]> {
    return this.fetchItems<Site>('sites');
  }

  regimes(): Promise<CatalogEntry[]> {
    return this.fetchItems<CatalogEntry>('regimes');
  }

  appointmentStatuses(): Promise<StatusEntry[]> {
    return this.fetchItems<StatusEntry>('appointment-statuses');
  }

  rescheduleStatuses(): Promise<StatusEntry[]> {
    return this.fetchItems<StatusEntry>('reschedule-statuses');
  }
}

let instance: CatalogsApi | null = null;

export function getCatalogsApi(): CatalogsApi {
  if (!instance) {
    instance = new CatalogsApi();
  }
  return instance;
}

/** Reinicia el singleton. Solo para pruebas. */
export function resetCatalogsApi(): void {
  instance = null;
}
