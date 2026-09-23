# citas-web

Frontend del sistema académico de agendamiento de citas **CitaClara**. Consume directamente la API REST de `citas-api` (sin Express ni BFF).

## Stack

- React 19 + TypeScript (estricto) + Vite 8
- Tailwind CSS 4 (plugin de Vite; tokens en `src/index.css`)
- React Router 7
- Public Sans y Material Symbols Outlined (Google Fonts)

Generado con Google AI Studio a partir del diseño aprobado en Stitch e importado y reconciliado en S2. Fuente de verdad visual: [`docs/diseno/DESIGN.md`](docs/diseno/DESIGN.md).

## Requisitos

- Node.js 24
- `citas-api` corriendo en `http://localhost:8081` para el modo `api`

## Ejecutar

```powershell
npm install
npm run dev                   # http://localhost:5174
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto **5174** (fijo: el 5173 lo usa otro grupo en el equipo del laboratorio) |
| `npm run typecheck` | Verificación de tipos (`tsc -b`) |
| `npm run lint` | Análisis estático con oxlint |
| `npm test` | Pruebas con Vitest (jsdom + Testing Library) |
| `npm run test:watch` | Pruebas en modo vigilancia |
| `npm run test:coverage` | Pruebas con informe de cobertura |
| `npm run build` | Verificación de tipos + build de producción en `dist/` |
| `npm run preview` | Sirve el build en el puerto 5174 |

Se usa **oxlint** en lugar de ESLint con `typescript-eslint`, porque este último todavía no admite TypeScript 7.

## Hooks de calidad

Los hooks viven en `.githooks/` y están versionados, pero Git no los activa solo. Una vez por clon:

```powershell
git config core.hooksPath .githooks
```

`pre-commit` ejecuta el **detector de secretos** sobre los archivos preparados en cada commit y, cuando el commit toca código o configuración, además `lint`, `test` y `build`. El detector bloquea siempre los archivos `.env`, las claves privadas y las credenciales de nube o de conexión; los patrones genéricos admiten exenciones justificadas por ruta en `.githooks/secrets-allowlist.txt`.

Para saltarlo en una emergencia, `git commit --no-verify`, dejando constancia del motivo.

## Configuración (`.env`)

Único archivo de entorno, **local y no versionado**. En un equipo nuevo créalo en esta carpeta con:

```dotenv
VITE_API_URL=http://localhost:8081
```

| Variable | Valores | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8081` | URL base de `citas-api`. **Obligatoria**: sin ella la aplicación falla de forma visible en vez de simular datos |

El origen del frontend debe coincidir con `FRONTEND_ORIGIN` de `citas-api` (por defecto `http://localhost:5174`) para que CORS lo acepte.

## Rutas

| Ruta | Pantalla |
|---|---|
| `/login` | Inicia sesión |
| `/registro` | Crea tu cuenta |
| `/inicio` | Página temporal de sesión (se reemplazará por el panel del paciente) |

## Estructura

```text
src/
  features/auth/
    api/          contrato (types) y cliente HTTP contra citas-api
    components/   AuthLayout, BrandMark, campos, botones, banners, resumen de errores, estado de éxito
    pages/        LoginPage, RegisterPage
    session/      tokens: access en memoria, refresh en sessionStorage; refresh con rotación
    validation/   reglas espejo del backend (el backend es la autoridad)
  features/catalogs/
    api/          cliente de los catálogos fijos (públicos, sin token)
    hooks/        useDocumentTypes y demás lecturas de catálogo para formularios
  shared/api/     configuración común: URL base obligatoria de la API
  test/setup.ts   arranque de Vitest (matchers y limpieza del DOM)
  pages/InicioPage.tsx   página temporal
```

Contratos REST: `citas-api/docs/contratos/autenticacion.md` y `citas-api/docs/contratos/catalogos.md`.
