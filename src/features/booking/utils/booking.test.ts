import { describe, expect, it } from 'vitest';
import type { AvailabilitySlot } from '../api/bookingApi';
import {
  ANY_SITE,
  buildAvailabilityQuery,
  distinctProfessionals,
  EMPTY_DRAFT,
  groupByProfessional,
  initials,
  isStepValid,
  slotLabel,
} from './booking';

const slot = (overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot => ({
  professionalId: 12,
  professionalName: 'Laura Gómez',
  specialtyId: 4,
  specialtyName: 'Cardiología',
  type: 'SPECIALIZED',
  durationMinutes: 60,
  siteCode: 'HIC',
  date: '2026-09-26',
  startTime: '09:00',
  endTime: '10:00',
  ...overrides,
});

describe('reglas del borrador de reserva', () => {
  it('paso 1 exige tipo, especialidad (si aplica) y sede', () => {
    expect(isStepValid(1, EMPTY_DRAFT)).toBe(false);
    expect(isStepValid(1, { ...EMPTY_DRAFT, kind: 'GENERAL' })).toBe(false);
    expect(isStepValid(1, { ...EMPTY_DRAFT, kind: 'GENERAL', siteChoice: ANY_SITE })).toBe(true);
    expect(isStepValid(1, { ...EMPTY_DRAFT, kind: 'SPECIALIZED', siteChoice: 'HIC' })).toBe(false);
    expect(isStepValid(1, { ...EMPTY_DRAFT, kind: 'SPECIALIZED', specialtyId: '4', siteChoice: 'HIC' })).toBe(true);
  });

  it('HU-012 CA-03: la consulta incluye solo los filtros elegidos', () => {
    const general = { ...EMPTY_DRAFT, kind: 'GENERAL' as const, siteChoice: ANY_SITE, date: '2026-09-26' };
    expect(buildAvailabilityQuery(general, true)).toEqual({ date: '2026-09-26', type: 'GENERAL' });

    const specialty = {
      ...EMPTY_DRAFT,
      kind: 'SPECIALIZED' as const,
      specialtyId: '4',
      siteChoice: 'ICV',
      date: '2026-09-26',
      professionalId: '12',
    };
    expect(buildAvailabilityQuery(specialty, true)).toEqual({
      date: '2026-09-26',
      siteCode: 'ICV',
      specialtyId: 4,
      professionalId: 12,
    });
    expect(buildAvailabilityQuery(specialty, false)).not.toHaveProperty('professionalId');
    expect(buildAvailabilityQuery({ ...specialty, date: null }, true)).toBeNull();
  });

  it('etiqueta de horario: inicio para 30 min, rango para 60 min', () => {
    expect(slotLabel(slot({ durationMinutes: 30, startTime: '08:00', endTime: '08:30' }))).toBe('08:00');
    expect(slotLabel(slot())).toBe('09:00 – 10:00');
  });

  it('agrupa por profesional y sede y lista profesionales distintos', () => {
    const items = [
      slot(),
      slot({ startTime: '10:00', endTime: '11:00' }),
      slot({ professionalId: 7, professionalName: 'Andrés Vargas', siteCode: 'ICV' }),
    ];
    const groups = groupByProfessional(items);
    expect(groups.map((g) => [g.professionalName, g.siteCode, g.slots.length])).toEqual([
      ['Laura Gómez', 'HIC', 2],
      ['Andrés Vargas', 'ICV', 1],
    ]);
    expect(distinctProfessionals(items)).toEqual([
      { id: 7, name: 'Andrés Vargas' },
      { id: 12, name: 'Laura Gómez' },
    ]);
  });

  it('las iniciales del avatar usan nombre y primer apellido en mayúsculas', () => {
    // Demo Red→Green de S3: esta prueba se intentó primero con 'AVR' y el hook bloqueó el commit.
    expect(initials('andrés vargas rojas')).toBe('AV');
    expect(initials('  Laura   Gómez ')).toBe('LG');
  });
});
