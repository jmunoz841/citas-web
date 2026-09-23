/**
 * URL base de `citas-api`. Es obligatoria: sin ella la aplicación no puede funcionar y
 * preferimos fallar de forma visible antes que servir datos simulados en silencio.
 */
export function apiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;

  if (!url || url.trim().length === 0) {
    throw new Error(
      'Falta VITE_API_URL. Crea el archivo .env de citas-web con la URL de la API (ver README).',
    );
  }

  return url.trim();
}
