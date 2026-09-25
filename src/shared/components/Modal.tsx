import React, { useEffect, useId, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  /** Texto bajo el título. */
  subtitle?: string;
  /** Ícono de Material Symbols junto al título. */
  icon?: string;
  /** `danger` tiñe el ícono con el color de error (rechazos, eliminaciones). */
  iconTone?: 'action' | 'danger';
  onClose: () => void;
  /** Ancho máximo en escritorio. En móvil el diálogo ocupa toda la pantalla. */
  maxWidth?: string;
  /** Pie fijo (botones). */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Mientras se envía algo, Escape y el fondo no cierran el diálogo. */
  busy?: boolean;
  /** Cuerpo sin padding (p. ej. un indicador de pasos que llega al borde). */
  flushBody?: boolean;
}

// Los elementos con tabindex="-1" (p. ej. días no activos de un calendario) no entran en el ciclo de Tab.
const FOCUSABLE = ['a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', '[tabindex]']
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

/**
 * Diálogo modal accesible: `role="dialog"`, `aria-modal`, título asociado, foco atrapado
 * dentro, Escape para cerrar y foco devuelto al elemento que lo abrió.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  subtitle,
  icon,
  iconTone = 'action',
  onClose,
  maxWidth = '560px',
  footer,
  children,
  busy = false,
  flushBody = false,
}) => {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
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
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#1C2430]/50"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        ref={dialogRef}
        aria-describedby={subtitle ? subtitleId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative bg-white w-full sm:rounded-xl sm:border sm:border-[#D9DDE3] shadow-[0_8px_32px_rgba(28,36,48,0.18)] flex flex-col max-h-screen sm:max-h-[calc(100vh-48px)]"
        onKeyDown={handleKeyDown}
        role="dialog"
        style={{ maxWidth }}
        tabIndex={-1}
      >
        <div className="flex items-start gap-3 px-5 sm:px-6 py-4 sm:py-5 border-b border-[#D9DDE3]">
          {icon && (
            <span
              aria-hidden="true"
              className={`material-symbols-outlined text-[22px] rounded-lg p-2 shrink-0 ${
                iconTone === 'danger' ? 'bg-[#FEF3F2] text-[#B42318]' : 'bg-[#E6F2F1] text-[#0F6E6E]'
              }`}
            >
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-[#1C2430] leading-tight" id={titleId}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#5B6573] mt-1" id={subtitleId}>
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
        <div className={`flex-1 overflow-y-auto ${flushBody ? '' : 'px-5 sm:px-6 py-5'}`}>{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#D9DDE3] flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
