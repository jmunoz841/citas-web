import {
  AuthApi,
  AuthError,
  AuthTokens,
  LoginRequest,
  ProblemDetails,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
} from './types';

export class HttpAuthApi implements AuthApi {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Trim trailing slashes if present
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');

    if (!res.ok) {
      if (isJson) {
        try {
          const problem: ProblemDetails = await res.json();
          throw new AuthError(problem);
        } catch (e) {
          if (e instanceof AuthError) throw e;
        }
      }

      if (res.status === 401) {
        throw new AuthError({
          status: 401,
          code: 'UNAUTHORIZED',
          detail: 'No autorizado.',
        });
      }

      if (res.status >= 500) {
        throw new AuthError({
          status: res.status,
          code: 'SERVER_ERROR',
          detail: 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
        });
      }

      throw new AuthError({
        status: res.status,
        code: 'HTTP_ERROR',
        detail: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      });
    }

    return res.json() as Promise<T>;
  }

  private async executeFetch<T>(url: string, init?: RequestInit): Promise<T> {
    try {
      const res = await fetch(url, init);
      return await this.handleResponse<T>(res);
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        throw err;
      }
      // Network failure (TypeError from fetch)
      throw new AuthError({
        status: 0,
        code: 'NETWORK_ERROR',
        detail: 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
      });
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.executeFetch<RegisterResponse>(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthTokens> {
    return this.executeFetch<AuthTokens>(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload: RefreshRequest = { refreshToken };
    return this.executeFetch<AuthTokens>(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const payload: RefreshRequest = { refreshToken };
    return this.executeFetch<void>(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async getSession(accessToken: string): Promise<SessionResponse> {
    return this.executeFetch<SessionResponse>(`${this.baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
