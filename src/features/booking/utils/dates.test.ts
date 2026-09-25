import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildMonthGrid,
  formatLongDate,
  formatLongDateCapitalized,
  formatMonthYear,
  formatTimeRange,
  parseIsoDate,
  shiftMonth,
  toIsoDate,
} from './dates';

describe('utilidades de fecha de la reserva', () => {
  it('toIsoDate usa la fecha local, no UTC (23:30 sigue siendo el mismo día)', () => {
    expect(toIsoDate(new Date(2026, 8, 25, 23, 30))).toBe('2026-09-25');
    expect(toIsoDate(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });

  it('parseIsoDate devuelve medianoche local del día indicado', () => {
    const date = parseIsoDate('2026-09-26');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 8, 26, 0]);
  });

  it('addDays cruza meses y años', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -7)).toBe('2026-09-24');
  });

  it('formatLongDate da el formato largo en español', () => {
    expect(formatLongDate('2026-09-26')).toBe('sábado, 26 de septiembre de 2026');
    expect(formatLongDate('2026-09-28')).toBe('lunes, 28 de septiembre de 2026');
    expect(formatLongDateCapitalized('2026-09-26')).toBe('Sábado, 26 de septiembre de 2026');
  });

  it('formatMonthYear y shiftMonth para la cabecera del calendario', () => {
    expect(formatMonthYear(2026, 8)).toBe('Septiembre 2026');
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });

  it('buildMonthGrid empieza en lunes y rellena con huecos', () => {
    // 1 de septiembre de 2026 es martes.
    const weeks = buildMonthGrid(2026, 8);
    expect(weeks[0]).toEqual([null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06']);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks[weeks.length - 1]).toContain('2026-09-30');
  });

  it('formatTimeRange usa guion largo con espacios', () => {
    expect(formatTimeRange('09:00', '10:00')).toBe('09:00 – 10:00');
  });
});
