# Registro de diseño y aprobación — Login y Registro (S2, paso 11)

| Versión | Fecha | Origen | Resultado |
|---|---|---|---|
| `stitch-v1/` | 2026-09-18 | Prompt inicial (skill `stitch-design-to-frontend`, modo Equilibrado / Gemini 3.8, ejecución manual) | Revisada: 7 problemas (logo roto, contenido inventado incl. un teléfono, consentimiento fuera de alcance, textos contradictorios con la API, responsive móvil, colores inconsistentes, sin resumen de errores) |
| `stitch-v2/` | 2026-09-18 | Prompt correctivo sobre v1 | 7/7 corregidos. **Aprobada** por Juan Muñoz ("apruebo la v2") |

## Decisiones de diseño

- Estilo "señalética hospitalaria serena" propuesto por el agente y aceptado por el usuario.
- Nombre ficticio del producto: **CitaClara** (no se usa la marca FCV).
- Consentimiento Ley 1581: **fuera de S2** (no existe en HU-001 ni en la API); candidato a HU futura.
- Responsive verificado en el HTML de v2 (el export de Stitch solo incluye capturas de escritorio).

## Fuente de verdad

`DESIGN.md` (este directorio) + capturas y HTML de `stitch-v2/`. `resumen.md` y los `DESIGN.md` generados por Stitch son solo referencia histórica.

## Pendiente para la implementación (handoff a AI Studio)

Campos vacíos por defecto (el export trae valores de ejemplo), `aria-invalid`/`aria-describedby`, excluir controles de simulación, tokens desde `DESIGN.md`.
