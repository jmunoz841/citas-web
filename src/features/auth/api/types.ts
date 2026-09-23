export interface RegisterRequest {
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
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
  roles: string[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ProblemDetails {
  status: number;
  detail: string;
  code: string;
  errors?: FieldError[];
}

export class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly fieldErrors: Record<string, string>;

  constructor(problem: ProblemDetails) {
    super(problem.detail || 'Ocurrió un error en la autenticación.');
    this.name = 'AuthError';
    this.status = problem.status;
    this.code = problem.code;
    this.detail = problem.detail;
    this.fieldErrors = {};

    if (problem.errors && Array.isArray(problem.errors)) {
      for (const err of problem.errors) {
        if (err.field && err.message) {
          this.fieldErrors[err.field] = err.message;
        }
      }
    }

    if (problem.code === 'EMAIL_ALREADY_REGISTERED') {
      this.fieldErrors.email = 'Este correo ya está registrado.';
    }
    if (problem.code === 'DOCUMENT_ALREADY_REGISTERED') {
      this.fieldErrors.documentNumber = 'Este documento ya está registrado.';
    }
  }
}

export interface AuthApi {
  register(data: RegisterRequest): Promise<RegisterResponse>;
  login(data: LoginRequest): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  getSession(accessToken: string): Promise<SessionResponse>;
}
