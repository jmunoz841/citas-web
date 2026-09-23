# AGENTS.md — `citas-web`

Instrucciones para el agente principal del frontend. Generado con `../prompts/agents/PROMPT_AGENT_CITAS_WEB.md` a partir del estado real del repositorio tras importar el export de Google AI Studio (2026-09-18). El orquestador cross-repo está en `../AGENTS.md`.

## Alcance

- Solo este repositorio. **No edites `citas-api`**; si el contrato REST no alcanza, reporta el cambio al orquestador.
- Fuente funcional: `../PRD.md` y las HU **Aprobadas** o **En desarrollo** de `../citas-api/docs/wiki/scrum/`. No implementes pantallas ni flujos fuera de una HU.
- Fuente visual: `docs/diseno/DESIGN.md` (prevalece) + capturas y HTML de `docs/diseno/stitch-v2/`. `stitch-v1/`, `resumen.md` y los `DESIGN.md` generados por Stitch son solo historial.
- Contrato REST: `../citas-api/docs/contratos/` (hoy: `autenticacion.md`).

## Stack real (no cambiar de framework)

| Pieza | Versión / detalle |
|---|---|
| Framework | React 19 + TypeScript 7 en modo `strict` (`noUnusedLocals`, `noUnusedParameters`) |
| Build | Vite 8 con `@vitejs/plugin-react` |
| Estilos | Tailwind CSS 4 vía `@tailwindcss/vite`; tokens en `@theme` de `src/index.css` |
| Rutas | React Router 7 (`BrowserRouter` en `src/App.tsx`) |
| Tipografía / íconos | Public Sans y Material Symbols Outlined desde Google Fonts (`index.html`) |
| Node | 24 |

No hay librerías de UI, de estado global ni de formularios: los formularios usan `useState` y validadores propios. No añadas dependencias sin una necesidad concreta de la HU.

## Comandos

Desde `citas-web/`:

```powershell
npm install
npm run dev         # http://localhost:5174 (strictPort)
npm run typecheck   # tsc -b
npm run build       # tsc -b && vite build
```

- Puerto **5174** fijo: el 5173 lo usa otro grupo en el equipo del laboratorio. Debe coincidir con `FRONTEND_ORIGIN` de `citas-api` (CORS).
- Para probar contra la API real: `citas-api` en `http://localhost:8081` (ver `../citas-api/AGENTS.md`).
- No uses el `docker-compose.yml` de la raíz ni toques recursos `fcv-citas-*` (otro grupo).
- Para lanzar el servidor en segundo plano desde PowerShell usa `Start-Process -FilePath npm.cmd -ArgumentList run,dev -WorkingDirectory <citas-web>`.

## Configuración

`.env` (único archivo de entorno, local y no versionado; no existe `.env.example` por indicación del instructor, D-017; contenido documentado en `README.md`):

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL base de `citas-api` (`http://localhost:8081`) |
| `VITE_AUTH_MODE` | `api` (cliente HTTP real) o `mock` (cliente en memoria; cuenta `demo@citaclara.test` / `Demo1234`). Si falta, `mock` cuando no hay `VITE_API_URL` |

Solo `import.meta.env`; nunca URLs ni credenciales escritas en el código.

## Estructura

```text
src/
  App.tsx                         rutas: / → /inicio o /login, /login, /registro, /inicio, * → /
  index.css                       tokens de DESIGN.md (@theme) + foco + reduced motion
  features/auth/
    api/types.ts                  DTOs del contrato, AuthError (code, status, fieldErrors), interfaz AuthApi
    api/httpAuthApi.ts            cliente fetch contra VITE_API_URL; traduce problem+json a AuthError
    api/mockAuthApi.ts            cliente simulado con el mismo contrato y códigos de error
    api/authApi.ts                selector por VITE_AUTH_MODE (singleton)
    session/sessionManager.ts     access token en memoria, refresh token en sessionStorage; refresh con rotación y deduplicado
    validation/validation.ts      reglas espejo del backend (política de contraseña, email, documento, teléfono)
    components/                   AuthLayout, BrandMark, SiteCard, SiteChip, Card, FormGroup, TextField, PasswordField,
                                  SelectField, PasswordChecklist, Button, AlertBanner, ErrorSummary, SuccessState
    pages/                        LoginPage, RegisterPage
  pages/InicioPage.tsx            TEMPORAL: sesión + cerrar sesión (se reemplaza por el panel del paciente)
```

Organización por *feature*: una nueva capacidad va en `src/features/<feature>/{api,components,pages,...}`. Los componentes genéricos que empiecen a usarse fuera de `auth` se mueven a una carpeta compartida en ese momento, no antes.

## Reglas

- **Sin Express ni BFF:** el navegador llama directamente a `citas-api`.
- **El backend es la autoridad.** La validación del cliente solo mejora la experiencia y debe coincidir con el contrato; nunca una regla de negocio existe solo en el cliente. Los errores del servidor (`errors[{field,message}]`, `code`) se muestran por campo o en banner.
- **Errores HTTP → UI:**
  - `VALIDATION_ERROR` → error en cada campo + resumen de errores.
  - `EMAIL_ALREADY_REGISTERED` / `DOCUMENT_ALREADY_REGISTERED` → campo + resumen ("ya registrado").
  - `INVALID_CREDENTIALS` → banner "Acceso no autorizado".
  - `INVALID_REFRESH_TOKEN` / `UNAUTHORIZED` → limpiar sesión y volver a `/login`.
  - Red o 5xx → banner "No pudimos conectar con el servidor. Inténtalo de nuevo." **No** cierra la sesión.
- **Tokens:** nunca en `localStorage`, logs, URLs ni mensajes. Reemplaza siempre el refresh token tras un refresh (rotación). Tras logout se descarta el access token en memoria.
- **Tipos del contrato:** si la API cambia un DTO, actualiza `api/types.ts` y ambos clientes (`http` y `mock`) en el mismo cambio.
- **Rutas protegidas:** usan `getCurrentSession()`; sin sesión válida redirigen a `/login`.

## Fidelidad visual

- Usa los tokens de `DESIGN.md`: acción `#0F6E6E` (hover `#0B5858`, pressed `#084747`), fondo `#F7F6F2`, texto `#1C2430`/`#5B6573`, borde `#D9DDE3`, panel `#0F3B3F`, error `#B42318` sobre `#FEF3F2` (borde 1.5px), éxito `#1E7B4F` sobre `#ECF7F1`, foco 3px `#2B8C8C` con offset 2px (clase `focus-ring-custom`).
- Tipografía: título de pantalla `h1` 28/36 móvil y 32/40 escritorio, inputs 16px en todos los tamaños, etiquetas 14px 600.
- Responsive: escritorio ≥1024 panel lateral 5/12 con fichas de sedes; tablet 768–1023 franja con chips; móvil <768 franja compacta y el formulario justo debajo, sin espacio vacío.
- **No rediseñes.** Un cambio visual requiere nueva iteración en Stitch y aprobación explícita del usuario. Al reconciliar, corrige solo la divergencia y conserva lo que ya coincide.
- No reintroduzcas los controles de simulación de Stitch, ni consentimiento Ley 1581, SMS/OTP, login social o enlaces legales.

## Accesibilidad (obligatoria)

`<label>` asociado a cada campo; `aria-invalid` y `aria-describedby` (error + ayuda) en campos con error; `role="alert"` en banners y resumen; foco al resumen o banner tras un envío fallido y al primer campo inválido en validación local; botones solo-ícono con nombre accesible; estado nunca solo con color; objetivos táctiles de 48px; `prefers-reduced-motion` respetado.

## Verificación

1. `npm run typecheck` y `npm run build` en verde. No declares una tarea terminada si fallan o no se ejecutaron.
2. **Todavía no hay pruebas automatizadas de frontend** (sin Vitest ni Testing Library). Si una HU exige pruebas, propón primero la herramienta al usuario y regístralo como decisión.
3. Verificación manual/visual:
   - Contra la API real con `VITE_AUTH_MODE=api` y `citas-api` corriendo, o con `mock` si la API no está disponible.
   - Capturas con Edge headless: `msedge --headless=new --window-size=1440,1000 --screenshot=<png> <url>`. Edge tiene un ancho mínimo de ~500px: para móvil (390px) carga la página dentro de un `<iframe width="390">` y captura ese HTML.
   - Compara contra `docs/diseno/stitch-v2/*/screen.png` y `DESIGN.md`.
4. Resume la evidencia y deja explícito lo no verificado (p. ej. lectores de pantalla reales).

## Modo de trabajo

1. Lee la HU, sus CA y la DoD.
2. Identifica pantallas, componentes y servicios afectados, y el contrato REST involucrado.
3. Mapea los estados: loading, empty, error, success, disabled.
4. Implementa sin rediseñar lo aprobado.
5. Ejecuta typecheck y build, y verifica el comportamiento.
6. Resume la evidencia.

## Documentación

- Diseño: `docs/diseno/` (aprobaciones en `APROBACION.md`; una carpeta `stitch-vN/` por iteración, nunca se sobrescribe).
- **No mantengas una LLM Wiki propia**: la wiki global está en `../citas-api/docs/wiki/llm-wiki/` y la mantiene el orquestador. Propónle los hechos o decisiones nuevos.

## Git

- Trabaja en `develop`; `main` solo cuando el usuario decida un merge.
- Conventional Commits con prefijo de sesión, p. ej. `feat(s2): ...`.
- Autor: Juan Munoz <jmunoz841@unab.edu.co>. **Sin líneas de coautoría de IA.**
- Sin reescritura de historial. Verifica que `.env`, `node_modules/` y `dist/` no queden en staging.
