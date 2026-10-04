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

// --- Reprogramaciones (HU-019) y bandeja (HU-022) ---

/** Filtros opcionales y combinables de la bandeja; fechas `yyyy-mm-dd` inclusivas. */
export interface InboxFilter {
  siteCode?: string;
  professionalId?: number;
  specialtyId?: number;
  from?: string;
  to?: string;
}

export interface RescheduleRequest {
  id: number;
  appointmentId: number;
  status: 'PENDING';
  patientName: string;
  professionalName: string;
  specialtyName: string;
  durationMinutes: number;
  originalDate: string;
  originalStartTime: string;
  originalSiteCode: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedSiteCode: string;
  requestedAt: string;
}

export interface RescheduleDecisionResponse {
  id: number;
  appointmentId: number;
  status: 'APPROVED' | 'REJECTED';
  decisionReason: string | null;
}

/** Quita los filtros vacíos: la API ignora los ausentes. */
function inboxQuery(filter: InboxFilter = {}) {
  return {
    siteCode: filter.siteCode || undefined,
    professionalId: filter.professionalId,
    specialtyId: filter.specialtyId,
    from: filter.from || undefined,
    to: filter.to || undefined,
  };
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
export interface InsuranceProvider { id: number; name: string; active: boolean; }
export interface InsurancePlan { id: number; epsId: number; name: string; active: boolean; }

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
  listRequests: (filter?: InboxFilter) =>
    apiRequest<ItemsResponse<AppointmentRequest>>(`${ADMIN}/appointments/requests`, {
      query: inboxQuery(filter),
    }).then((r) => r.items),

  approve: (id: number) => apiRequest<DecisionResponse>(`${ADMIN}/appointments/${id}/approve`, { method: 'POST' }),

  reject: (id: number, reason: string) =>
    apiRequest<DecisionResponse>(`${ADMIN}/appointments/${id}/reject`, { method: 'POST', body: { reason } }),

  listReschedules: (filter?: InboxFilter) =>
    apiRequest<ItemsResponse<RescheduleRequest>>(`${ADMIN}/reschedule-requests`, {
      query: inboxQuery(filter),
    }).then((r) => r.items),

  approveReschedule: (id: number) =>
    apiRequest<RescheduleDecisionResponse>(`${ADMIN}/reschedule-requests/${id}/approve`, { method: 'POST' }),

  rejectReschedule: (id: number, reason: string) =>
    apiRequest<RescheduleDecisionResponse>(`${ADMIN}/reschedule-requests/${id}/reject`, {
      method: 'POST',
      body: { reason },
    }),

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
  listEps: () => apiRequest<ItemsResponse<InsuranceProvider>>(`${ADMIN}/eps`).then((r) => r.items),
  createEps: (name: string) => apiRequest<InsuranceProvider>(`${ADMIN}/eps`, { method: 'POST', body: { name } }),
  updateEps: (id: number, name: string) => apiRequest<InsuranceProvider>(`${ADMIN}/eps/${id}`, { method: 'PATCH', body: { name } }),
  setEpsActive: (id: number, active: boolean) => apiRequest<InsuranceProvider>(`${ADMIN}/eps/${id}/active`, { method: 'PATCH', body: { active } }),
  listPlans: (id: number) => apiRequest<ItemsResponse<InsurancePlan>>(`${ADMIN}/eps/${id}/plans`).then((r) => r.items),
  createPlan: (id: number, name: string) => apiRequest<InsurancePlan>(`${ADMIN}/eps/${id}/plans`, { method: 'POST', body: { name } }),
  updatePlan: (id: number, name: string) => apiRequest<InsurancePlan>(`${ADMIN}/eps/plans/${id}`, { method: 'PATCH', body: { name } }),
  setPlanActive: (id: number, active: boolean) => apiRequest<InsurancePlan>(`${ADMIN}/eps/plans/${id}/active`, { method: 'PATCH', body: { active } }),
};
