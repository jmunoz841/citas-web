import type { AvailabilityQuery, AvailabilitySlot, SpecialtyType } from '../api/bookingApi';
import { formatTimeRange } from './dates';

/** Valor de "Cualquiera" en la sede preferida: la búsqueda omite `siteCode`. */
export const ANY_SITE = '*';

export interface BookingDraft {
  kind: SpecialtyType | null;
  /** Solo para `SPECIALIZED`; cadena vacía hasta elegir. */
  specialtyId: string;
  /** Código de sede o `ANY_SITE`. */
  siteChoice: string | null;
  date: string | null;
  /** Cadena vacía = "Cualquier profesional". */
  professionalId: string;
  slot: AvailabilitySlot | null;
}

export const EMPTY_DRAFT: BookingDraft = {
  kind: null,
  specialtyId: '',
  siteChoice: null,
  date: null,
  professionalId: '',
  slot: null,
};

export const STEP_NAMES = ['Tipo de cita', 'Fecha y profesional', 'Horario', 'Confirmación'] as const;

/** ¿Puede avanzar desde el paso `step` (1 a 4)? */
export function isStepValid(step: number, draft: BookingDraft): boolean {
  switch (step) {
    case 1:
      return (
        draft.kind !== null &&
        (draft.kind === 'GENERAL' || draft.specialtyId !== '') &&
        draft.siteChoice !== null
      );
    case 2:
      return draft.date !== null;
    case 3:
      return draft.slot !== null;
    default:
      return true;
  }
}

/** Filtros de `GET /api/v1/availability` para el borrador. */
export function buildAvailabilityQuery(draft: BookingDraft, withProfessional: boolean): AvailabilityQuery | null {
  if (!draft.date || !draft.kind || draft.siteChoice === null) return null;
  const query: AvailabilityQuery = { date: draft.date };
  if (draft.siteChoice !== ANY_SITE) query.siteCode = draft.siteChoice;
  if (draft.kind === 'GENERAL') {
    query.type = 'GENERAL';
  } else if (draft.specialtyId) {
    query.specialtyId = Number(draft.specialtyId);
  }
  if (withProfessional && draft.professionalId) query.professionalId = Number(draft.professionalId);
  return query;
}

/** Identifica un inicio reservable. */
export function slotKey(slot: AvailabilitySlot): string {
  return `${slot.professionalId}|${slot.siteCode}|${slot.date}|${slot.startTime}`;
}

/** "08:00" para 30 min; "09:00 – 10:00" para citas más largas. */
export function slotLabel(slot: AvailabilitySlot): string {
  return slot.durationMinutes > 30 ? formatTimeRange(slot.startTime, slot.endTime) : slot.startTime;
}

export interface ProfessionalGroup {
  key: string;
  professionalId: number;
  professionalName: string;
  specialtyName: string;
  siteCode: string;
  slots: AvailabilitySlot[];
}

/** Agrupa los horarios por profesional y sede, conservando el orden de la API. */
export function groupByProfessional(slots: AvailabilitySlot[]): ProfessionalGroup[] {
  const groups = new Map<string, ProfessionalGroup>();
  for (const slot of slots) {
    const key = `${slot.professionalId}|${slot.siteCode}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        professionalId: slot.professionalId,
        professionalName: slot.professionalName,
        specialtyName: slot.specialtyName,
        siteCode: slot.siteCode,
        slots: [],
      };
      groups.set(key, group);
    }
    group.slots.push(slot);
  }
  return Array.from(groups.values());
}

/** Profesionales distintos de un resultado, ordenados por nombre. */
export function distinctProfessionals(slots: AvailabilitySlot[]): { id: number; name: string }[] {
  const seen = new Map<number, string>();
  for (const slot of slots) {
    if (!seen.has(slot.professionalId)) seen.set(slot.professionalId, slot.professionalName);
  }
  return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Iniciales para el avatar del profesional. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
