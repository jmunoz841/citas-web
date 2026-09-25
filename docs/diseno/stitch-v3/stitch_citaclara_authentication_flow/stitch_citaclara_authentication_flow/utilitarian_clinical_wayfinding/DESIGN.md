---
name: Utilitarian Clinical Wayfinding
colors:
  surface: '#f8f9ff'
  surface-dim: '#d2daeb'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#e1e8f9'
  surface-container-highest: '#dbe3f3'
  on-surface: '#141c28'
  on-surface-variant: '#3e4948'
  inverse-surface: '#29313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#6e7979'
  outline-variant: '#bec9c8'
  surface-tint: '#03696a'
  primary: '#005454'
  on-primary: '#ffffff'
  primary-container: '#0f6e6e'
  on-primary-container: '#9eedec'
  inverse-primary: '#85d4d3'
  secondary: '#3d6569'
  on-secondary: '#ffffff'
  secondary-container: '#bde7ec'
  on-secondary-container: '#41696d'
  tertiary: '#743c1d'
  on-tertiary: '#ffffff'
  tertiary-container: '#915332'
  on-tertiary-container: '#ffd8c6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f0ef'
  primary-fixed-dim: '#85d4d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#c0eaef'
  secondary-fixed-dim: '#a4ced2'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#244d51'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb692'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#6f3819'
  background: '#f8f9ff'
  on-background: '#141c28'
  surface-variant: '#dbe3f3'
typography:
  display-lg:
    fontFamily: Public Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Public Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  caption:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system establishes a quiet, utilitarian, and reassuringly precise atmosphere designed for patient appointment scheduling within complex healthcare environments. The aesthetic rejects decorative healthcare tropes—avoiding hearts, pulses, transparent glass, or high-saturation accents—in favor of functional architectural wayfinding, structured institutional signage, and low-cognitive-load layouts.

Primary attributes:
- **Quiet Utilitarianism:** Surfaces remain calm, matte, and intentional. Information density is managed through structural hierarchy rather than visual ornamentation.
- **Architectural Wayfinding:** Left-hand navigation and progress anchors borrow from municipal and modern hospital signage, orienting the patient continuously regarding location, progress, and next steps.
- **Cognitive Accessibility:** Tailored to diverse age ranges and digital literacies, with deliberate contrast ratios, large tap targets, explicit labels, and unambiguous validation states.

## Colors

The color system centers around a deep clinical teal paired with architectural off-white backgrounds, balancing clinical authority with human-centered warmth.

### Roles & Palette Values
- **Canvas / Page Background:** `#F7F6F2` (Warm Off-White) provides a non-glare, eye-resting background.
- **Surface:** `#FFFFFF` defines active workspace cards and input fields.
- **Primary Text:** `#1C2430` (Near Black) for critical wayfinding, active values, and primary headings.
- **Secondary Text:** `#5B6573` (Muted Slate) for helper text, structural labels, and inactive state cues.
- **Borders & Dividers:** `#D9DDE3` for crisp structural outlines and compartment separation.
- **Action / Primary Accent:** `#0F6E6E` (Deep Teal) for primary triggers and confirmed pathway indicators.
  - Hover: `#0B5858`
  - Pressed: `#084747`
  - Tint / Surface Accent: `#E6F2F1` (for active selection indicators and highlighted tags)
- **Focus Indicator:** `#2B8C8C` styled as a strict `3px` solid stroke with a `2px` offset.
- **Wayfinding Anchor (Rail/Panel):** `#0F3B3F` (Deep Teal-Ink) for permanent navigation containers.
  - Panel On-Surface: `#F2F7F7` (Primary Text)
  - Panel On-Surface Muted: `#A9C5C5` (Secondary Step Descriptions)
- **Feedback & Semantics:**
  - Danger / Error: `#B42318` text/border on `#FEF3F2` background.
  - Success: `#1E7B4F` text/border on `#ECF7F1` background.
  - Warning: `#A15C00` text on `#FFF8ED` background.

## Typography

Public Sans is deployed universally across all roles to emulate institutional clarity and functional municipal signage. 

- **Display & Headlines:** Used strictly for wayfinding anchors, clinic identifiers, and appointment section headers. Tight negative letter spacing is applied to larger scales for cohesive scanning.
- **Labels:** `label-md` is rendered in uppercase with subtle tracking (`0.04em`) when designating wayfinding metadata, room numbers, or operational states.
- **Readability Rules:** Tabular numbers (`font-variant-numeric: tabular-nums`) must be enabled on all date, time, clinical code, and document identification fields to maintain vertical alignment in scheduling grids.

## Layout & Spacing

The layout is anchored by an 8px base rhythm that governs component internals and structural viewport divisions.

### Wayfinding Layout Structure
- **Desktop (>= 1024px):** Fixed left wayfinding rail (`#0F3B3F`, width `320px`) with the remaining canvas operating on a fluid grid with a maximum content container of `880px`. Column gap is fixed to `1.5rem` (`24px`).
- **Tablet (768px - 1023px):** Collapsed sticky top wayfinding bar showing current step, location, and progress counter. Margin scales to `1.5rem` (`24px`).
- **Mobile (< 768px):** Single-column layout. Top-pinned horizontal progress tracker with fixed height (`56px`). Outer canvas margin is `1rem` (`16px`).

### Vertical Rhythm
- Standard gap between form fields is strictly `1.5rem` (`24px`).
- Structural section spacing inside cards is `2rem` (`32px`).
- In-line component gaps (icon to text, checkbox to label) adhere to `0.5rem` (`8px`) or `0.75rem` (`12px`).

## Elevation & Depth

This system avoids layered multi-tier shadows, simulating physical clarity through planar surfaces, structural borders, and controlled contrast.

- **Primary Elevation (Form & Content Cards):** A single, quiet drop shadow (`0 2px 8px rgba(28, 36, 48, 0.06)`) combined with a crisp `1px` border in `#D9DDE3`.
- **Canvas Base:** `#F7F6F2` remains completely flat.
- **Overlays / Modal Dialogs:** Backdrop uses `rgba(15, 59, 63, 0.4)` (tinted ink overlay). The dialog surface carries an elevated shadow: `0 8px 24px rgba(28, 36, 48, 0.12)` with a `1px` border in `#D9DDE3`.
- **Active Selection Tiers:** Selected appointment slots or clinic branches drop elevation entirely and utilize high-contrast border and background shifts (`#E6F2F1` background with `2px` solid `#0F6E6E` border) rather than floating shadows.

## Shapes

Corner radii balance utilitarian structure with approachable interaction touchpoints:

- **Form Cards & Panels:** Bound by an explicit `12px` border radius (`rounded-lg`), grounding large surfaces.
- **Interactive Controls (Inputs, Buttons, Dropdowns):** Consistently use an `8px` border radius (`rounded-md`), providing tactile definition without resembling playful pills.
- **Status Tags & Micro Badges:** Use `4px` border radius (`rounded-sm`) to retain an architectural, label-tape appearance.
- **Wayfinding Step Nodes:** Pure circles (`9999px`) reserved only for numeric steps, radio selection dots, and status indicators.

## Components

### Buttons
- **Primary:** Background `#0F6E6E`, text `#FFFFFF`, border `none`, radius `8px`, min-height `48px`. Hover: `#0B5858`. Pressed: `#084747`. Focus: `3px` solid `#2B8C8C` with `2px` offset.
- **Secondary / Outline:** Background `#FFFFFF`, text `#0F6E6E`, border `1px` solid `#0F6E6E`, radius `8px`. Hover: `#E6F2F1`.
- **Tertiary / Wayfinding Back:** Background transparent, text `#5B6573`, padding-inline `0`. Hover: `#1C2430`.

### Form Fields & Inputs
- **Base Style:** Background `#FFFFFF`, text `#1C2430`, border `1px` solid `#D9DDE3`, radius `8px`, min-height `48px`, horizontal padding `16px`.
- **Labeling:** Permanent label rendered above the field in `label-lg` (`#1C2430`), accompanied by optional secondary instructions in `caption` (`#5B6573`).
- **Error State:** Border `1.5px` solid `#B42318`, background `#FEF3F2`. Error message below in `#B42318` accompanied by an inline error indicator.

### Time Slot & Doctor Selection Cards (Wayfinding Tiles)
- **Default:** Background `#FFFFFF`, border `1px` solid `#D9DDE3`, radius `8px`, padding `16px`.
- **Selected:** Background `#E6F2F1`, border `2px` solid `#0F6E6E`, inner text `#0F6E6E`.
- **Disabled:** Background `#F7F6F2`, border `1px` dashed `#D9DDE3`, text `#5B6573` with strikethrough timing.

### Checkboxes & Radio Buttons
- **Control Sizing:** Strict `20px x 20px` target with `8px` margin to label.
- **Radio:** Circular, border `2px` solid `#D9DDE3`. Active state displays `#0F6E6E` ring with `#0F6E6E` center dot.
- **Checkbox:** Square, radius `4px`, border `2px` solid `#D9DDE3`. Active state displays solid `#0F6E6E` fill with white checkmark.

### Left-Hand Wayfinding Rail
- Fixed surface in `#0F3B3F`. Steps feature numeric badges:
  - Completed: `#0F6E6E` filled circle with white check icon.
  - Active: `#FFFFFF` filled circle with `#0F3B3F` numeral; active label in `#F2F7F7`.
  - Upcoming: `#0F3B3F` circle with `#A9C5C5` border and text; label in `#A9C5C5`.