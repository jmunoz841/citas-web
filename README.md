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
| `npm run build` | Verificación de tipos + build de producción en `dist/` |
| `npm run preview` | Sirve el build en el puerto 5174 |

## Configuración (`.env`)

Único archivo de entorno, **local y no versionado**. En un equipo nuevo créalo en esta carpeta con:

```dotenv
VITE_API_URL=http://localhost:8081
VITE_AUTH_MODE=api
```

| Variable | Valores | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8081` | URL base de `citas-api` |
| `VITE_AUTH_MODE` | `api` \| `mock` | `api` llama a la API real; `mock` simula las respuestas en memoria (cuenta de prueba `demo@citaclara.test` / `Demo1234`) |

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
    api/          contrato (types), cliente HTTP, cliente simulado y selector por VITE_AUTH_MODE
    components/   AuthLayout, BrandMark, campos, botones, banners, resumen de errores, estado de éxito
    pages/        LoginPage, RegisterPage
    session/      tokens: access en memoria, refresh en sessionStorage; refresh con rotación
    validation/   reglas espejo del backend (el backend es la autoridad)
  pages/InicioPage.tsx   página temporal
```

Contrato REST: `citas-api/docs/contratos/autenticacion.md`.
