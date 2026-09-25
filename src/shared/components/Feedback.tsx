import React from 'react';

/** Estado activo/inactivo: siempre ícono + texto, nunca solo color. */
export const StatusLabel: React.FC<{ active: boolean; activeText: string; inactiveText: string }> = ({
  active,
  activeText,
  inactiveText,
}) => (
  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${active ? 'text-[#1E7B4F]' : 'text-[#5B6573]'}`}>
    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
      {active ? 'check_circle' : 'cancel'}
    </span>
    {active ? activeText : inactiveText}
  </span>
);

/** Chip de sede sobre superficie clara ("HIC", "ICV"). */
export const SiteBadge: React.FC<{ code: string; title?: string }> = ({ code, title }) => (
  <span
    className="inline-flex items-center rounded-md bg-[#E6F2F1] text-[#0F6E6E] text-xs font-semibold tracking-wide px-2 py-1"
    title={title}
  >
    {code}
  </span>
);

/** Chip neutro con tinte de acción (tipo "General", especialidades). */
export const Chip: React.FC<{ children: React.ReactNode; icon?: string; tone?: 'action' | 'neutral' | 'warning' }> = ({
  children,
  icon,
  tone = 'action',
}) => {
  const tones = {
    action: 'bg-[#E6F2F1] text-[#0F6E6E]',
    neutral: 'bg-white text-[#5B6573] border border-[#D9DDE3]',
    warning: 'bg-[#FFF8ED] text-[#A15C00]',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold px-2 py-1 ${tones[tone]}`}>
      {icon && (
        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

/** Estado vacío de una lista. */
export const EmptyState: React.FC<{ icon: string; title: string; description: string; action?: React.ReactNode }> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center text-center gap-3 px-6 py-12">
    <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[#0F6E6E] bg-[#E6F2F1] rounded-full p-3">
      {icon}
    </span>
    <p className="text-base font-semibold text-[#1C2430]">{title}</p>
    <p className="text-sm text-[#5B6573] max-w-md">{description}</p>
    {action}
  </div>
);

/** Filas esqueleto mientras carga una tabla. */
export const SkeletonRows: React.FC<{ rows?: number; label?: string }> = ({ rows = 3, label = 'Cargando…' }) => (
  <div aria-busy="true" className="flex flex-col" role="status">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-14 border-b border-[#D9DDE3] last:border-b-0 px-6 flex items-center gap-4">
        <span className="h-3 w-1/4 rounded bg-[#EEF0F2] animate-pulse" />
        <span className="h-3 w-1/5 rounded bg-[#EEF0F2] animate-pulse" />
        <span className="h-3 w-1/6 rounded bg-[#EEF0F2] animate-pulse" />
      </div>
    ))}
  </div>
);

/** Encabezado de pantalla: título 32/40 (28/36 móvil), subtítulo y acción principal. */
export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
    <div className="min-w-0">
      <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 font-bold tracking-[-0.02em] text-[#1C2430]">
        {title}
      </h1>
      {subtitle && <p className="text-base sm:text-lg text-[#5B6573] mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
