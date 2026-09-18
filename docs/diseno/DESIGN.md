# DESIGN.md — CitaClara (fuente de verdad visual)

- **Estado:** aprobado por Juan Muñoz el 2026-09-18 (Stitch v2).
- **Pantallas aprobadas:** `stitch-v2/.../inicia_sesi_n_citaclara/` (Login) y `stitch-v2/.../crea_tu_cuenta_citaclara/` (Registro). Cada carpeta contiene `screen.png` (referencia visual) y `code.html` (referencia de estructura y estados).
- **Prevalece este archivo** sobre `stitch-v*/.../DESIGN.md` y `stitch-v1/resumen.md`, generados por Stitch con valores y requisitos que no fueron aprobados (p. ej. `#005454`, superficies azuladas, OTP, SMS, métricas inventadas).
- La implementación **no** reinterpreta este sistema. Cambios visuales requieren nueva iteración en Stitch y nueva aprobación.

## Tesis

Señalética hospitalaria serena: orden, alta legibilidad, superficies tranquilas y un único color de acción que siempre indica "por aquí". Sin decoración médica.

## Color (roles)

| Rol | Valor |
|---|---|
| Fondo de página | `#F7F6F2` |
| Superficie (tarjeta, inputs) | `#FFFFFF` |
| Texto principal | `#1C2430` |
| Texto secundario / ayudas | `#5B6573` |
| Borde | `#D9DDE3` |
| Acción | `#0F6E6E` · hover `#0B5858` · pressed `#084747` |
| Tinte de acción (lista de requisitos, chips) | `#E6F2F1` |
| Anillo de foco | `#2B8C8C`, 3px sólido, offset 2px |
| Panel de orientación | fondo `#0F3B3F`, texto `#F2F7F7`, secundario `#A9C5C5`; fichas y chips de sedes sobre `#002020` translúcido con ícono `#A1F0EF` (tonos de las capturas aprobadas) |
| Error | texto/borde `#B42318` sobre `#FEF3F2` |
| Éxito | `#1E7B4F` sobre `#ECF7F1` |
| Advertencia | `#A15C00` sobre `#FFF8ED` |

El estado nunca se comunica solo con color: siempre ícono + texto.

## Tipografía

Public Sans (Google Fonts) en toda la interfaz.

| Uso | Tamaño / interlineado / peso |
|---|---|
| Título de pantalla | 32/40, 700, tracking −0.02em (móvil 28/36) |
| Subtítulo | 18/28, 400, secundario |
| Cuerpo e inputs | 16/24, 400 |
| Etiqueta de campo | 14/20, 600 |
| Etiqueta de grupo | 12/16, 600, mayúsculas, tracking 0.08em, con ícono |
| Ayuda / error de campo | 12–13/16, 400 |

Números tabulares (`font-variant-numeric: tabular-nums`) en número de documento y teléfono.

## Espaciado, superficies y forma

- Retícula de 8px. 24px entre campos; 32px entre grupos.
- Tarjeta: fondo blanco, borde 1px `#D9DDE3`, radio 12px, sombra única `0 2px 8px rgba(28,36,48,0.06)`, padding 40px (escritorio) / 20px (móvil).
- Inputs y botones: radio 8px, alto mínimo 48px, padding horizontal 16px. Input: fondo blanco, borde 1px `#D9DDE3`; error: borde 1.5px `#B42318`, fondo `#FEF3F2`, ícono de alerta y mensaje debajo.
- Botón primario: `#0F6E6E`, texto blanco 600, ancho completo en formularios.
- Íconos de línea (Material Symbols Outlined o equivalente de trazo fino), usados con moderación: ubicación, ojo, alerta, check, grupos del formulario.
- Movimiento: transiciones de 150ms en hover/foco y cambios de la lista de requisitos; respetar `prefers-reduced-motion`.

## Marca

Marca dibujada en el propio código (sin imágenes externas): cuadrado de 32px con radio 8px en `#0F6E6E` con una cruz blanca, seguido de "Cita" (700, `#F2F7F7`) + "Clara" (400, `#A9C5C5`). Etiqueta "SEDES CLÍNICAS" en chip sobre el panel.

## Estructura (shell compartido)

- **Escritorio (≥1024px):** panel izquierdo 5/12 `#0F3B3F` a toda la altura con marca, título "Atención Médica Digital", lema "Agenda tus citas médicas en dos sedes, sin filas ni llamadas.", fichas de sedes (ícono de ubicación, código + nombre, dirección) y pie "Proyecto académico · Datos ficticios". Área derecha 7/12 `#F7F6F2` con tarjeta centrada: 480px (Login), 640px (Registro).
- **Panel plegable (solo escritorio, cambio aprobado 2026-09-18):** botón de ícono `left_panel_close` junto al chip "SEDES CLÍNICAS" (40×40px, color `#A9C5C5`, hover `#F2F7F7` sobre fondo blanco al 10%, foco estándar). Al plegar, el panel se reduce a un **riel de 72px** con el isotipo arriba y el botón `left_panel_open` debajo; se ocultan wordmark (queda para lectores de pantalla), chip, lema, fichas y pie; el formulario se centra en el espacio restante. Transición de ancho 200ms. El botón expone `aria-expanded` y nombre "Ocultar panel de sedes"/"Mostrar panel de sedes". La preferencia se recuerda en el navegador (`localStorage`, clave `citaclara_panel_sedes_plegado`). No aplica a tablet ni móvil.
- **Tablet (768–1023px):** panel convertido en franja superior (~160px) con marca, lema y dos chips: "HIC · Hospital Internacional de Colombia", "ICV · Instituto Cardiovascular" (sin direcciones). Formulario debajo.
- **Móvil (<768px):** franja superior (~64px) con marca y lema; sin sedes ni pie. El formulario es lo primero interactivo; sin borde de tarjeta; pares de campos apilados; objetivos táctiles ≥48px.

Sedes (contenido fijo del PRD):
- HIC — Hospital Internacional de Colombia · Km 7 Autopista Bucaramanga–Piedecuesta, Valle de Menzulí, Santander
- ICV — Instituto Cardiovascular · Calle 155A No. 23-58, Urbanización El Bosque, Floridablanca, Santander

## Pantalla: Login

- Título "Inicia sesión"; subtítulo "Accede para gestionar tus citas."
- Campos: "Correo electrónico"; "Contraseña" con botón ojo ("Mostrar contraseña"/"Ocultar contraseña").
- Enlace "¿Olvidaste tu contraseña?" alineado a la derecha (HU-002, aún sin pantalla: no navega en S2).
- Botón "Iniciar sesión" con flecha; carga: "Ingresando…" con spinner y deshabilitado.
- Separador y pie: "¿No tienes cuenta?" + enlace "Crea tu cuenta".
- Error 401: banner arriba del formulario, título "Acceso no autorizado", texto "Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo."

## Pantalla: Registro

- Título "Crea tu cuenta"; subtítulo "Tus datos se usan solo para agendar tus citas."
- Grupos:
  1. DATOS PERSONALES — "Nombres" (ayuda "Tal como figura en tu identificación"), "Apellidos" (ayuda "Primer y segundo apellido").
  2. DOCUMENTO DE IDENTIDAD — "Tipo de documento" (Cédula de ciudadanía (CC), Cédula de extranjería (CE), Tarjeta de identidad (TI), Registro civil (RC), Pasaporte (PA), Permiso por protección temporal (PPT); ayuda "Válido ante el sistema de salud en Colombia"), "Número de documento" (ayuda "Puedes escribirlo con o sin puntos").
  3. DATOS DE CONTACTO — "Correo electrónico" (ayuda "Recibirás confirmaciones y recordatorios"), "Teléfono" (ayuda "Para contactarte sobre tus citas").
  4. SEGURIDAD DE LA CUENTA — "Contraseña" y "Confirmar contraseña", ambos con ojo; lista "Requisitos de contraseña:" en tinte `#E6F2F1` con tres filas en vivo: "Al menos 8 caracteres", "Al menos una letra", "Al menos un número" (ícono check = cumplido, círculo vacío = pendiente).
- Obligatorios marcados con `*`.
- Botón "Crear cuenta"; carga "Creando cuenta…".
- Pie: "¿Ya tienes cuenta?" + enlace "Inicia sesión".
- Conflicto 409: error en el campo ("Este correo ya está registrado." / "Este documento ya está registrado.") y resumen arriba "Revisa los campos marcados:" con enlaces a los campos.
- Éxito: reemplaza el formulario; ícono check en círculo (éxito), "¡Tu cuenta fue creada!", "Ya puedes iniciar sesión con tu correo y contraseña.", botón "Ir a iniciar sesión".

## Accesibilidad (obligatoria en implementación)

WCAG 2.2 AA; `<label>` visible y asociado en cada campo (el placeholder nunca sustituye la etiqueta); `aria-invalid` y `aria-describedby` en campos con error; banner y resumen con `role="alert"`; foco visible en todo control; orden de tabulación lógico; el botón ojo anuncia su estado; resumen de errores enlaza a los campos.

## Excluido explícitamente

Controles de simulación ("Modo de simulación", pestañas de estado) y "Guía de estados de componentes" del export de Stitch: son herramientas de revisión, no producto. También: consentimiento Ley 1581 (fuera de HU-001), SMS, OTP, login social, fotos o ilustraciones médicas, teléfonos de soporte, enlaces legales.
