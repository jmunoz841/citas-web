import { apiRequest, ItemsResponse } from '../../../shared/api/apiClient';

/**
 * Endpoints de administración (rol ADMIN). Contratos:
 * `citas-api/docs/contratos/citas.md` (HU-015) y `citas-api/docs/contratos/administracion.md`
 * (HU-006, HU-008, HU-009).
 */

// --- Solicitudes (HU-015) ---

export interface AppointmentRequest {
  id: number;
  status: string;
  patientName: string;
  professionalName: string;
  specialtyName: string;
  siteCode: string;
  /** `yyyy-mm-dd` */
  date: string;
  /** `HH:mm` */
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DecisionResponse {
  id: number;
  status: 'APPROVED' | 'REJECTED';
}

/** Máximo del motivo de rechazo (RN-04). */
export const MAX_REASON_LENGTH = 500;

// --- Especialidades (HU-006) ---

export type DurationMinutes = 30 | 60;

export interface Specialty {
  id: number;
  name: string;
  durationMinutes: number;
  general: boolean;
  active: boolean;
}

export interface SpecialtyInput {
  name: string;
  durationMinutes: DurationMinutes;
}

// --- Profesionales (HU-008, HU-009) ---

export interface SpecialtyAssignment {
  specialtyId: number;
  primary: boolean;
}

export interface Professional {
  id: number;
  firstNames: string;
  lastNames: string;
  email: string;
  professionalCode: string;
  licenseNumber: string;
  active: boolean;
  specialties: SpecialtyAssignment[];
  siteCodes: string[];
}

export interface CreateProfessionalInput {
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  temporaryPassword: string;
  professionalCode: string;
  licenseNumber: string;
  specialties: SpecialtyAssignment[];
  siteCodes: string[];
}

const ADMIN = '/api/v1/admin';

export const adminApi = {
  listRequests: () =>
    apiRequest<ItemsResponse<AppointmentRequest>>(`${ADMIN}/appointments/requests`).then((r) => r.items),

  approve: (id: number) => apiRequest<DecisionResponse>(`${ADMIN}/appointments/${id}/approve`, { method: 'POST' }),

  reject: (id: number, reason: string) =>
    apiRequest<DecisionResponse>(`${ADMIN}/appointments/${id}/reject`, { method: 'POST', body: { reason } }),

  /** Todas las especialidades, incluidas las inactivas. */
  listSpecialties: () => apiRequest<ItemsResponse<Specialty>>(`${ADMIN}/specialties`).then((r) => r.items),

  createSpecialty: (input: SpecialtyInput) =>
    apiRequest<Specialty>(`${ADMIN}/specialties`, { method: 'POST', body: input }),

  updateSpecialty: (id: number, input: Partial<SpecialtyInput>) =>
    apiRequest<Specialty>(`${ADMIN}/specialties/${id}`, { method: 'PATCH', body: input }),

  setSpecialtyActive: (id: number, active: boolean) =>
    apiRequest<Specialty>(`${ADMIN}/specialties/${id}/active`, { method: 'PATCH', body: { active } }),

  listProfessionals: () =>
    apiRequest<ItemsResponse<Professional>>(`${ADMIN}/professionals`).then((r) => r.items),

  createProfessional: (input: CreateProfessionalInput) =>
    apiRequest<Professional>(`${ADMIN}/professionals`, { method: 'POST', body: input }),

  assignSpecialties: (id: number, specialties: SpecialtyAssignment[]) =>
    apiRequest<Professional>(`${ADMIN}/professionals/${id}/specialties`, { method: 'PUT', body: { specialties } }),

  assignSites: (id: number, siteCodes: string[]) =>
    apiRequest<Professional>(`${ADMIN}/professionals/${id}/sites`, { method: 'PUT', body: { siteCodes } }),

  setProfessionalActive: (id: number, active: boolean) =>
    apiRequest<Professional>(`${ADMIN}/professionals/${id}/active`, { method: 'PATCH', body: { active } }),
};
