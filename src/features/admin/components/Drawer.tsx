import React, { useEffect, useId, useRef } from 'react';

interface DrawerProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Mientras se guarda, Escape y el fondo no cierran el cajón. */
  busy?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Cajón lateral derecho ("Editar asignaciones"). Misma accesibilidad que `Modal`: `role="dialog"`,
 * `aria-modal`, foco atrapado, Escape y foco devuelto al abrirlo. En móvil ocupa toda la pantalla.
 * Se monta solo cuando está abierto.
 */
export const Drawer: React.FC<DrawerProps> = ({ title, subtitle, icon, onClose, footer, children, busy = false }) => {
  const titleId = useId();
  const subtitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panelRef.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      previous?.focus?.();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#1C2430]/50"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        ref={panelRef}
        aria-describedby={subtitle ? subtitleId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative bg-white w-full sm:max-w-[480px] h-full sm:border-l sm:border-[#D9DDE3] shadow-[0_8px_32px_rgba(28,36,48,0.18)] flex flex-col"
        onKeyDown={handleKeyDown}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start gap-3 px-5 sm:px-6 py-4 sm:py-5 border-b border-[#D9DDE3]">
          {icon && (
            <span aria-hidden="true" className="material-symbols-outlined text-[22px] rounded-lg p-2 shrink-0 bg-[#E6F2F1] text-[#0F6E6E]">
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-[#1C2430] leading-tight" id={titleId}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#5B6573] mt-1 tabular-nums" id={subtitleId}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            aria-label="Cerrar"
            className="h-10 w-10 -mr-2 -mt-1 rounded-lg flex items-center justify-center text-[#5B6573] hover:bg-[#F7F6F2] focus-ring-custom disabled:opacity-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
              close
            </span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#D9DDE3] flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
