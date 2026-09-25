// Fechas de la reserva. Se trabaja siempre con componentes locales (`YYYY-MM-DD`): nunca
// `toISOString()`, que pasa a UTC y puede cambiar el día en America/Bogota.

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** Encabezados del calendario, de lunes a domingo. */
export const WEEKDAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const pad = (n: number) => String(n).padStart(2, '0');

/** `Date` → `YYYY-MM-DD` con la fecha local. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → `Date` a medianoche local. */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Hoy en formato `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** Suma días a una fecha `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** "sábado, 26 de septiembre de 2026". */
export function formatLongDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

/** "Sábado, 26 de septiembre de 2026" (inicio de frase). */
export function formatLongDateCapitalized(iso: string): string {
  const text = formatLongDate(iso);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Septiembre 2026". `month` va de 0 a 11. */
export function formatMonthYear(year: number, month: number): string {
  const name = MONTHS[month];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** Mes siguiente o anterior como `{ year, month }`. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/**
 * Semanas del mes, de lunes a domingo. Cada celda es una fecha `YYYY-MM-DD` o `null` para los
 * huecos antes del día 1 y después del último día.
 */
export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // lunes = 0
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIsoDate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** "09:00 – 10:00". */
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}
