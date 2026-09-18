# Product Requirements Document (PRD) & Design Brief: CitaClara

**Versión:** 1.0  
**Fecha:** Octubre 2024  
**Producto:** CitaClara — Sistema Digital de Agendamiento de Citas Médicas  
**Estado:** Aprobado para implementación y diseño de interfaz  
**Audiencia:** Diseñadores de producto, desarrolladores frontend/backend, líderes médicos y de operaciones clínicas  

---

## 1. Visión General del Producto

### 1.1 Resumen Ejecutivo
**CitaClara** es una plataforma web y móvil de agendamiento médico ambulatorio diseñada para transformar el acceso a la salud en Santander, Colombia. Su propósito es erradicar las filas presenciales y la congestión en líneas telefónicas en dos de las instituciones clínicas de referencia más importantes del país:
- **HIC — Hospital Internacional de Colombia** (Km 7 Autopista Bucaramanga–Piedecuesta, Valle de Menzulí)
- **ICV — Instituto Cardiovascular** (Calle 155A No. 23-58, Floridablanca)

La plataforma provee un flujo de autoservicio para pacientes, garantizando alta accesibilidad, claridad clínica y certeza en la asignación de citas en medicina general, especialidades y subespecialidades.

### 1.2 Declaración del Problema
- **Sobrecarga de canales convencionales:** Las líneas PBX de las sedes clínicas presentan tiempos de espera superiores a 25 minutos y una tasa de llamadas abandonadas del 38%.
- **Vulnerabilidad emocional y cognitiva:** Los pacientes acuden al sistema en estados de estrés, dolor o incertidumbre sobre su salud. Las interfaces complejas o confusas incrementan la ansiedad y conducen a errores en la selección de especialidad o sede.
- **Brecha de alfabetización digital y diversidad generacional:** La base de pacientes abarca desde jóvenes adultos hasta adultos mayores con dificultades visuales o motrices, requiriendo máxima legibilidad, navegación predecible y asistencia en cada paso.

### 1.3 Objetivos de Negocio y Métricas Clave (KPIs)
- **Tasa de conversión de registro (Funnel Completion):** ≥ 85% de los pacientes que inician el registro deben completarlo sin soporte asistido.
- **Reducción de carga en Call Center:** Disminuir en un 45% las solicitudes telefónicas de asignación y consulta de citas en los primeros 6 meses.
- **Tiempo de completado de autenticación:** < 60 segundos para inicio de sesión recurrente; < 2.5 minutos para registro inicial.
- **Tasa de errores de validación:** < 5% de rechazos en backend por inconsistencias en tipo/número de documento.
- **Accesibilidad:** 100% de conformidad con los estándares **WCAG 2.2 Nivel AA**.

---

## 2. Personas de Usuario y Casos de Uso

### Persona 1: Don Hernando (67 años) — Paciente Cardiovascular
- **Perfil:** Jubilado, residente en Piedecuesta. Acude periódicamente a control cardiológico en el ICV. Usa smartphone con tamaño de letra aumentado.
- **Frustración:** Las llamadas constantes le producen agotamiento y confunde las fechas si no recibe confirmación escrita clara.
- **Necesidad:** Interfaz limpia con letras grandes, contrastes definidos, formularios simples sin laberintos de menús y confirmación inmediata vía SMS y correo.

### Persona 2: Valentina (34 años) — Madre y Profesional
- **Perfil:** Vive en Bucaramanga, gestiona el tiempo de manera estricta entre su trabajo y el cuidado de sus dos hijos y sus padres.
- **Frustración:** Incompatibilidad de horarios de atención telefónica con su jornada laboral.
- **Necesidad:** Crear su cuenta rápidamente, ingresar en cualquier momento y reservar citas para ella o familiares en el HIC de forma autónoma y sin fricciones.

---

## 3. Alcance Funcional: Flujo de Autenticación y Registro

### 3.1 Pantalla 1: Inicio de Sesión (`Inicia sesión — CitaClara`)
- **Acción Principal:** `Iniciar sesión`.
- **Campos:**
  - `Correo electrónico`: Validación sintáctica RFC 5322; detección de espacios accidentales.
  - `Contraseña`: Entrada enmascarada con botón accesible *"Mostrar contraseña / Ocultar contraseña"* (icono de ojo).
- **Enlaces Secundarios:**
  - `¿Olvidaste tu contraseña?`: Acceso a recuperación por código OTP vía correo o SMS.
  - `Crea tu cuenta`: Transición directa hacia el formulario de registro.
- **Manejo de Errores y Alertas:**
  - Banner superior de alerta contextual ante credenciales inválidas (código HTTP 401):  
    *«Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.»*
  - Bloqueo temporal por fuerza bruta tras 5 intentos fallidos con temporizador de reactivación.

### 3.2 Pantalla 2: Registro Único de Paciente (`Crea tu cuenta — CitaClara`)
- **Acción Principal:** `Crear cuenta`.
- **Estructura Modular de Campos:**
  1. **Datos Personales:**
     - `Nombres` y `Apellidos` obligatorios, permitiendo caracteres especiales en español (ñ, tildes, diéresis).
  2. **Documento de Identidad (Normativa Colombiana):**
     - Selector `Tipo de documento`: Cédula de Ciudadanía (`CC`), Cédula de Extranjería (`CE`), Tarjeta de Identidad (`TI`), Registro Civil (`RC`), Pasaporte (`PA`), Permiso por Protección Temporal (`PPT`).
     - `Número de documento`: Campo numérico / alfanumérico con formato tabular y validación de longitud por tipo de documento.
  3. **Datos de Contacto:**
     - `Correo electrónico`: Destinado a confirmaciones y notificaciones oficiales.
     - `Teléfono celular`: Con formato nacional colombiano (`+57 3XX XXX XXXX`) para recordatorios SMS automatizados.
  4. **Seguridad de la Cuenta:**
     - `Contraseña` y `Confirmar contraseña` con visualizadores independientes.
     - **Checklist dinámico de validación en tiempo real:**
       - [x] Al menos 8 caracteres.
       - [x] Al menos una letra.
       - [x] Al menos un número.
  5. **Consentimiento Legal:**
     - Checkbox obligatorio de tratamiento de datos personales conforme a la **Ley Estatutaria 1581 de 2012** (Habeas Data Colombia).
- **Manejo de Conflictos de API (HTTP 409):**
  - Validación en línea: *"Este correo ya está registrado"* y *"Este documento ya está registrado"* con enlace rápido a recuperación de cuenta.
- **Estado de Éxito:**
  - Reemplazo completo del formulario por pantalla de confirmación: Icono de verificación verde, titular *«¡Tu cuenta fue creada!»*, texto informativo y botón primario *«Ir a iniciar sesión»*.

---

## 4. Tesis de Diseño Visual y Sistema de Identidad

### 4.1 Filosofía de Diseño: "Wayfinding Clínico Utilitario"
El sistema visual se basa en los principios de la señalética arquitectónica hospitalaria: orden jerárquico impecable, superficies tranquilas, reducción absoluta de ruido decorativo y un color de acción contundente que indica unívocamente *"avanza aquí"*.

- **Prohibiciones estéticas explícitas:** Prohibido el uso de estetoscopios, corazones genéricos, líneas de electrocardiograma (ECG), fotografías de archivo de doctores fingiendo sonrisas, gradientes estridentes, efectos de vidrio (glassmorphism), botones de inicio de sesión social o logotipos de EPS ajenas.

### 4.2 Arquitectura de Color (Tokens de Diseño)
| Rol | Código Hex | Semántica y Uso |
|---|---|---|
| **Action / Primary** | `#0F6E6E` | Color principal de interacción (botones primarios, enlaces activos, checkboxes seleccionados). |
| **Primary Hover** | `#0B5858` | Estado suspendido de elementos accionables. |
| **Primary Pressed** | `#084747` | Estado activo / presionado. |
| **Accent Tint** | `#E6F2F1` | Fondos de etiquetas activas, micro-destacados y selección suave. |
| **Wayfinding Canvas (Izquierda)** | `#0F3B3F` | Fondo del panel lateral en desktop, transmitiendo serenidad institucional y solidez. |
| **Surface (Fondo General)** | `#F7F6F2` | Tono hueso cálido no reflectivo que reduce la fatiga visual. |
| **Surface Card** | `#FFFFFF` | Contenedores y tarjetas principales de formulario. |
| **Text Primary** | `#1C2430` | Tipografía principal, títulos y entradas de texto (alto contraste). |
| **Text Secondary** | `#5B6573` | Subtítulos, etiquetas explicativas y metadatos. |
| **Borders** | `#D9DDE3` | Separadores y contornos sutiles de 1px. |
| **Focus Ring** | `#2B8C8C` | Anillo accesible de enfoque de 3px con desplazamiento (offset) de 2px. |
| **Danger / Error** | `#B42318` sobre `#FEF3F2` | Banners de error, contornos de campos inválidos y mensajes de alerta. |
| **Success** | `#1E7B4F` sobre `#ECF7F1` | Mensajes de éxito y requisitos de contraseña cumplidos. |

### 4.3 Tipografía y Números Tabulares
- **Familia Tipográfica:** *Public Sans* (Google Fonts) en toda la aplicación.
- **Escala:**
  - Encabezados principales: 32px / line-height 40px, negrita (700), tracking -0.02em.
  - Subtítulos de sección: 18px / line-height 28px, regular (400).
  - Texto de cuerpo y campos de entrada: 16px / line-height 24px.
  - Etiquetas de campo (Labels): 14px / line-height 20px, seminegrita (600).
  - Etiquetas de grupo: 12px / line-height 16px, mayúsculas con letter-spacing de 0.08em.
  - Números tabulares (`font-feature-settings: "tnum"`): Obligatorio en documentos de identidad, teléfonos y códigos horarios para evitar saltos ópticos.

---

## 5. Diseño Responsivo y Reglas de Adaptabilidad

| Factor de Forma | Ancho | Comportamiento del Panel de Sedes (Wayfinding) | Comportamiento del Formulario |
|---|---|---|---|
| **Desktop** | ≥ 1024px | Panel izquierdo 5/12 de ancho, altura completa `#0F3B3F`. Logo superior, statement y fichas de sedes HIC e ICV completas con dirección física. | Panel derecho 7/12 con fondo `#F7F6F2`. Tarjeta blanca centrada (480px en Login, 640px en Registro) con padding de 40px y sombra suave. |
| **Tablet** | 768px – 1023px | Se transforma en una franja superior horizontal (~160px). Muestra logo, premisa y las 2 sedes sintetizadas en chips interactivos compactos. | Formulario centrado con padding de 32px; campos agrupados en parejas donde el ancho lo permita. |
| **Mobile** | < 768px | Franja superior condensada con isotipo/logotipo y lema corto. Se oculta la dirección detallada de sedes para priorizar la carga cognitiva. | Tarjeta a sangre (sin bordes externos ni sombras); campos apilados verticalmente; botones con altura mínima de 48px para cumplimiento táctil ergonómico. |

---

## 6. Accesibilidad y Estándares WCAG 2.2 AA

1. **Etiquetado Explícito y Permanente:** Cada campo posee un elemento `<label>` semántico y persistente ubicado arriba del input. Nunca se utilizan placeholders como sustitutos de etiqueta.
2. **Independencia del Color para Transmitir Estado:** Los estados de error, advertencia y éxito van acompañados siempre de un icono con significado unívoco (alerta, check, cruz) y texto descriptivo.
3. **Manejo de Enfoque por Teclado:** Secuencia lógica de tabulación (`tabindex`), visible focus ring teal `#2B8C8C` en todos los controles interactivos y ausencia de trampas de foco.
4. **Asociación de Errores con Atributos ARIA:** Los mensajes de validación están vinculados a sus respectivos inputs mediante `aria-describedby` y `aria-invalid="true"`.
5. **Legibilidad con Tecnologías de Asistencia:** Conmutadores de visibilidad de contraseñas anuncian su estado dinámicamente (`aria-pressed` o `aria-label="Mostrar contraseña"` / `aria-label="Ocultar contraseña"`).

---

## 7. Próximos Pasos y Hoja de Ruta (Fases Subsiguientes)

- **Fase 2:** Flujo de recuperación y restablecimiento de contraseña (`/recuperar-clave`) con código temporal de un solo uso (OTP).
- **Fase 3:** Portal de paciente y asistente de selección de especialidad médica (Cardiología, Pediatría, Medicina Interna, Cirugía, etc.).
- **Fase 4:** Selector interactivo de agenda clínica (calendario mensual, selección de franja horaria mañana/tarde y asignación de sede HIC o ICV).
- **Fase 5:** Confirmación de cita, descarga de volante de preparación médica y recordatorios automatizados por WhatsApp / SMS.
