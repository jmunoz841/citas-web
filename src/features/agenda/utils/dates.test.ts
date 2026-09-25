import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatLongDay,
  formatShortDay,
  formatWeekRange,
  isPast,
  parseIsoDate,
  slotCount,
  startOfWeek,
  timeOptions,
  toIsoDate,
  weekDays,
} from './dates';

describe('utilidades de fecha de la agenda (HU-010)', () => {
  it('la semana empieza el lunes, también si hoy es domingo', () => {
    expect(toIsoDate(startOfWeek(new Date(2026, 8, 25)))).toBe('2026-09-21');
    expect(toIsoDate(startOfWeek(new Date(2026, 8, 21)))).toBe('2026-09-21');
    expect(toIsoDate(startOfWeek(new Date(2026, 8, 27)))).toBe('2026-09-21');
    expect(toIsoDate(startOfWeek(new Date(2026, 8, 28)))).toBe('2026-09-28');
  });

  it('muestra de lunes a sábado', () => {
    const days = weekDays(new Date(2026, 8, 21)).map(toIsoDate);
    expect(days).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26']);
  });

  it('construye YYYY-MM-DD con componentes locales, sin desfase por zona horaria', () => {
    const lateNight = new Date(2026, 8, 25, 23, 45);
    expect(toIsoDate(lateNight)).toBe('2026-09-25');
    expect(toIsoDate(parseIsoDate('2026-01-05'))).toBe('2026-01-05');
    expect(toIsoDate(addDays(new Date(2026, 11, 30), 3))).toBe('2027-01-02');
  });

  it('formatea días y el rango de la semana en español', () => {
    const monday = new Date(2026, 8, 21);
    expect(formatShortDay(monday)).toBe('21 sep');
    expect(formatLongDay(new Date(2026, 8, 22))).toBe('Martes 22 de septiembre');
    expect(formatWeekRange(monday)).toBe('21 – 26 sep 2026');
    expect(formatWeekRange(new Date(2026, 8, 28))).toBe('28 sep – 3 oct 2026');
    expect(formatWeekRange(new Date(2025, 11, 29))).toBe('29 dic 2025 – 3 ene 2026');
  });

  it('ofrece horas en pasos de 30 minutos y cuenta espacios', () => {
    const options = timeOptions();
    expect(options[0]).toBe('00:00');
    expect(options[1]).toBe('00:30');
    expect(options.at(-1)).toBe('23:30');
    expect(options).toHaveLength(48);
    expect(slotCount('08:00', '12:00')).toBe(8);
    expect(slotCount('12:00', '08:00')).toBe(0);
  });

  it('detecta horarios pasados', () => {
    const now = new Date(2026, 8, 25, 10, 15);
    expect(isPast('2026-09-24', '18:00', now)).toBe(true);
    expect(isPast('2026-09-25', '10:00', now)).toBe(true);
    expect(isPast('2026-09-25', '10:30', now)).toBe(false);
    expect(isPast('2026-09-26', '07:00', now)).toBe(false);
  });
});
