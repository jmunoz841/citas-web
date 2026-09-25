// Utilidades de calendario con fechas locales. Nunca se usa toISOString() para una fecha de
// calendario: convierte a UTC y en Bogotá (UTC−5) movería la fecha al día siguiente por la noche.

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Minutos de un espacio de agenda. */
export const SLOT_MINUTES = 30;
/** Días visibles del calendario: lunes a sábado. */
export const VISIBLE_DAYS = 6;

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` a partir de los componentes locales. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Fecha local a medianoche desde `YYYY-MM-DD`. */
export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Lunes de la semana de `date` (el domingo pertenece a la semana que termina ese día). */
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

/** Lunes a sábado desde el lunes dado. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(monday, i));
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

/** "22 sep" */
export function formatShortDay(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "Lunes 22 de septiembre" */
export function formatLongDay(date: Date): string {
  return `${weekdayName(date)} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** "22 – 27 sep 2026", "29 sep – 4 oct 2026" o "29 dic 2025 – 3 ene 2026". */
export function formatWeekRange(monday: Date): string {
  const end = addDays(monday, VISIBLE_DAYS - 1);
  const sameYear = monday.getFullYear() === end.getFullYear();
  if (sameYear && monday.getMonth() === end.getMonth()) {
    return `${monday.getDate()} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${formatShortDay(monday)} – ${formatShortDay(end)} ${end.getFullYear()}`;
  }
  return `${formatShortDay(monday)} ${monday.getFullYear()} – ${formatShortDay(end)} ${end.getFullYear()}`;
}

/** "08:30" → 510 */
export function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/** 510 → "08:30" */
export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Hora actual como `HH:mm`. */
export function currentTime(now: Date): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Horas en pasos de 30 minutos de 00:00 a 23:30. La API recibe `HH:mm` (LocalTime) y el bloque
 * no puede cruzar la medianoche, así que "24:00" no es un valor válido.
 */
export function timeOptions(): string[] {
  return Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, i) => minutesToTime(i * SLOT_MINUTES));
}

/** Espacios de 30 minutos entre dos horas; 0 si el rango no es válido. */
export function slotCount(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? Math.floor(diff / SLOT_MINUTES) : 0;
}

/** ¿Empieza antes de `now`? Compara la fecha y hora locales. */
export function isPast(date: string, time: string, now: Date): boolean {
  const today = toIsoDate(now);
  if (date !== today) return date < today;
  return timeToMinutes(time) < timeToMinutes(currentTime(now));
}
