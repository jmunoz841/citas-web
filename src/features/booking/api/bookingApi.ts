import { apiRequest, ItemsResponse } from '../../../shared/api/apiClient';

// Contratos: citas-api/docs/contratos/catalogos.md y citas-api/docs/contratos/citas.md.

export type SpecialtyType = 'GENERAL' | 'SPECIALIZED';

export interface Specialty {
  id: number;
  name: string;
  durationMinutes: number;
  type: SpecialtyType;
}

export interface Site {
  code: string;
  name: string;
  address: string;
}

export interface AvailabilitySlot {
  professionalId: number;
  professionalName: string;
  specialtyId: number;
  specialtyName: string;
  type: SpecialtyType;
  durationMinutes: number;
  siteCode: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityQuery {
  date: string;
  siteCode?: string;
  type?: SpecialtyType;
  specialtyId?: number;
  professionalId?: number;
}

export interface CreateAppointmentRequest {
  professionalId: number;
  specialtyId: number;
  siteCode: string;
  date: string;
  startTime: string;
}

export type AppointmentStatus = 'APPROVED' | 'REQUESTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface AppointmentResponse {
  id: number;
  status: AppointmentStatus;
  professionalId: number;
  specialtyId: number;
  siteCode: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

/** Especialidades activas (público). */
export async function fetchSpecialties(): Promise<Specialty[]> {
  const res = await apiRequest<ItemsResponse<Specialty>>('/api/v1/catalogs/specialties', { auth: false });
  return res.items ?? [];
}

/** Sedes HIC e ICV (público). */
export async function fetchSites(): Promise<Site[]> {
  const res = await apiRequest<ItemsResponse<Site>>('/api/v1/catalogs/sites', { auth: false });
  return res.items ?? [];
}

/** Inicios reservables de un día (rol USER). Los filtros vacíos se omiten de la consulta. */
export async function searchAvailability(query: AvailabilityQuery): Promise<AvailabilitySlot[]> {
  const res = await apiRequest<ItemsResponse<AvailabilitySlot>>('/api/v1/availability', {
    query: { ...query },
  });
  return res.items ?? [];
}

/** Reserva una cita. Medicina General → `APPROVED`; otra especialidad → `REQUESTED`. */
export function createAppointment(body: CreateAppointmentRequest): Promise<AppointmentResponse> {
  return apiRequest<AppointmentResponse>('/api/v1/appointments', { method: 'POST', body });
}

/** Vista de una cita propia devuelta por HU-016. */
export interface PatientAppointment {
  id: number;
  status: AppointmentStatus;
  professionalName: string;
  specialtyName: string;
  siteCode: string;
  siteName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rejectionReason: string | null;
}

export interface MyAppointmentsQuery {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

/** Citas del USER autenticado; los filtros vacios no se envian. */
export async function fetchMyAppointments(query: MyAppointmentsQuery = {}): Promise<PatientAppointment[]> {
  const res = await apiRequest<ItemsResponse<PatientAppointment>>('/api/v1/appointments', {
    query: { status: query.status, from: query.from, to: query.to },
  });
  return res.items ?? [];
}

/** Detalle con ownership: la API responde 404 para una cita ajena. */
export function fetchMyAppointment(id: number): Promise<PatientAppointment> {
  return apiRequest<PatientAppointment>(`/api/v1/appointments/${id}`);
}
