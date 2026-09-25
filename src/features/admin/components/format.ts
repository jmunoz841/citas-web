/** `2026-09-26` → `26/09/2026` (sin pasar por `Date` para no depender de la zona horaria). */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/** `09:00`, `10:00` → `09:00 – 10:00`. La API puede incluir segundos: se recortan. */
export function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

/** Iniciales de las dos primeras palabras: "Ana Pérez" → "AP". */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
