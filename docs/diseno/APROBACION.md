# Registro de diseño y aprobación

## Login y Registro (S2, paso 11)

| Versión | Fecha | Origen | Resultado |
|---|---|---|---|
| `stitch-v1/` | 2026-09-18 | Prompt inicial (skill `stitch-design-to-frontend`, modo Equilibrado / Gemini 3.8, ejecución manual) | Revisada: 7 problemas (logo roto, contenido inventado incl. un teléfono, consentimiento fuera de alcance, textos contradictorios con la API, responsive móvil, colores inconsistentes, sin resumen de errores) |
| `stitch-v2/` | 2026-09-18 | Prompt correctivo sobre v1 | 7/7 corregidos. **Aprobada** por Juan Muñoz ("apruebo la v2") |

### Cambios posteriores a la aprobación

| Fecha | Cambio | Aprobación | Proceso |
|---|---|---|---|
| 2026-09-18 | Panel de sedes plegable en escritorio (riel de 72px con isotipo y botón) | Solicitado y aprobado por Juan Muñoz (opción "riel delgado") | Implementado directamente en código por decisión del usuario, sin iteración en Stitch; verificado con capturas desplegado/plegado; especificación en `DESIGN.md` |

### Decisiones de diseño

- Estilo "señalética hospitalaria serena" propuesto por el agente y aceptado por el usuario.
- Nombre ficticio del producto: **CitaClara** (no se usa la marca FCV).
- Consentimiento Ley 1581: **fuera de S2** (no existe en HU-001 ni en la API); candidato a HU futura.
- Responsive verificado en el HTML de v2 (el export de Stitch solo incluye capturas de escritorio).

### Fuente de verdad

`DESIGN.md` (este directorio) + capturas y HTML de `stitch-v2/`. `resumen.md` y los `DESIGN.md` generados por Stitch son solo referencia histórica.

### Pendiente para la implementación (handoff a AI Studio)

Campos vacíos por defecto (el export trae valores de ejemplo), `aria-invalid`/`aria-describedby`, excluir controles de simulación, tokens desde `DESIGN.md`.

## Áreas autenticadas de S3 (ADMIN, PROFESSIONAL, USER)

Extiende el sistema aprobado en la v2; no lo reemplaza. Pantallas para HU-006, HU-008, HU-009, HU-010, HU-012, HU-013, HU-014 y HU-015.

| Versión | Fecha | Origen | Resultado |
|---|---|---|---|
| `stitch-v3/` | 2026-09-25 | Tres prompts por rol (ADMIN, PROFESSIONAL, USER) sobre `DESIGN.md` y las capturas de la v2; modo Equilibrado / Gemini 3.8, ejecución manual | Revisada: fondo azulado (`#f8f9ff`) en lugar de `#F7F6F2`; contenido inventado (SLA, notificaciones "en tiempo real", soporte telefónico 24/7, navegación "Mis Citas", "Historial", "Pacientes", "Configuración"); métricas, buscador y paginación que la API no ofrece; tablas cuyas acciones no caben; inconsistencias de datos y de textos |
| `stitch-v4/` | 2026-09-25 | Prompt correctivo sobre v3 | Colores, contenido inventado visible, navegación, métricas y textos corregidos; se añadió el diálogo de rechazo en estado de error. **Aprobada** por Juan Muñoz ("apruebo") con las correcciones de implementación de abajo |

### Pantallas aprobadas (`stitch-v4/stitch_citaclara_authentication_flow/stitch_citaclara_authentication_flow/`)

| Carpeta | Rol | HU |
|---|---|---|
| `solicitudes_pendientes_citaclara_admin/` | ADMIN | HU-015 |
| `rechazar_solicitud_error_de_validaci_n_citaclara_admin/` | ADMIN | HU-015 |
| `especialidades_citaclara_admin/` | ADMIN | HU-006 |
| `profesionales_citaclara_admin/` | ADMIN | HU-008, HU-009 |
| `mi_agenda_citaclara_profesional/` | PROFESSIONAL | HU-010 |
| `inicio_citaclara_paciente/` (modal de 4 pasos y resultados en el HTML) | USER | HU-012, HU-013, HU-014 |

La carpeta exportada se llamaba `stitch_citaclara_authentication_flow (1)`; se renombró sin el sufijo para tener rutas sin espacios ni paréntesis.

### Correcciones obligatorias en la implementación

La aprobación queda condicionada a que el código aplique estas correcciones, que no se iteraron en Stitch:

1. **Ancho de las tablas.** Todas las acciones quedan visibles a 1280 px y más: en Solicitudes, "Aprobar" y "Rechazar" completos; en Profesionales, "Editar asignaciones" y "Desactivar"/"Activar". Ni el riel ("Solicitudes pendientes"), ni la cabecera ("Admin Laboratorio"), ni el botón "Nueva especialidad" parten su texto en dos líneas.
2. **Badge de solicitudes:** es el número real de citas `REQUESTED`, el mismo en todas las pantallas.
3. **Textos inventados que siguen en el HTML y no se implementan:** "Gestiona tus citas médicas en tiempo real con disponibilidad garantizada", "Abierto 24/7", "CitaClara v2.4" y la miga "DIRECTORIO MÉDICO CENTRAL · Gestión Institucional".
4. **Subtítulo del diálogo de rechazo:** "El motivo queda registrado en el historial de la cita." (no "Se informará al paciente…": no hay notificaciones).
5. **Paso 3 del modal ("Horario"):** se toma del HTML de `inicio_citaclara_paciente/`, incluido el conflicto "Ese horario acaba de ser reservado por otra persona. Elige otro."

### Fuente de verdad

`DESIGN.md` (este directorio), secciones "Áreas autenticadas (S3)", y las capturas y el HTML de `stitch-v4/`. Los simuladores de estados y el `DESIGN.md` generado por Stitch (`utilitarian_clinical_wayfinding/`) son solo referencia; `stitch-v3/` queda como historial.
