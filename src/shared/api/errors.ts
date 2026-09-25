export interface FieldError {
  field: string;
  message: string;
}

/** ProblemDetail (RFC 9457) con `code` estable, tal como lo devuelve `citas-api`. */
export interface ProblemDetails {
  status: number;
  detail: string;
  code: string;
  errors?: FieldError[];
}

export const CONNECTION_ERROR_MESSAGE = 'No pudimos conectar con el servidor. Inténtalo de nuevo.';

/**
 * Error de la API traducido a algo que la UI puede mostrar: `code` para decidir el mensaje,
 * `fieldErrors` para marcar cada campo. `status` 0 significa fallo de red.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly fieldErrors: Record<string, string>;

  constructor(problem: ProblemDetails) {
    super(problem.detail || 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    this.name = 'ApiError';
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

  /** Red caída o error 5xx: se muestra el banner de conexión y **no** se cierra la sesión. */
  get isConnectionProblem(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}
