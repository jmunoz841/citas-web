export interface RegisterRequest {
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  /** Afiliación opcional (HU-004): ambos campos o ninguno. */
  insurancePlanId?: number;
  regimeCode?: string;
}

export interface RegisterResponse {
  id: number;
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface SessionResponse {
  userId: number;
  email: string;
  firstNames: string;
  lastNames: string;
  roles: string[];
}

// El error de la API es común a todas las features; se conserva el nombre AuthError por compatibilidad.
export { ApiError as AuthError } from '../../../shared/api/errors';
export type { FieldError, ProblemDetails } from '../../../shared/api/errors';

export interface AuthApi {
  register(data: RegisterRequest): Promise<RegisterResponse>;
  login(data: LoginRequest): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  getSession(accessToken: string): Promise<SessionResponse>;
}
