import React from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';
import { initialsOf } from './format';

/** Tarjeta blanca de las tablas: borde #D9DDE3, radio 12px, sombra única. */
export const TableCard: React.FC<{ children: React.ReactNode; footer?: React.ReactNode }> = ({ children, footer }) => (
  <div className="bg-white border border-[#D9DDE3] rounded-xl shadow-[0_2px_8px_rgba(28,36,48,0.06)] overflow-hidden">
    {children}
    {footer && <div className="border-t border-[#D9DDE3] px-4 md:px-6 py-3 text-sm text-[#5B6573]">{footer}</div>}
  </div>
);

/** Encabezado de columna: 14/20, 600, secundario sobre blanco. */
export const Th: React.FC<{ children?: React.ReactNode; className?: string; srOnly?: boolean }> = ({
  children,
  className = '',
  srOnly = false,
}) => (
  <th className={`py-3.5 px-2.5 first:pl-6 last:pr-6 text-left text-sm font-semibold text-[#5B6573] ${className}`} scope="col">
    {srOnly ? <span className="sr-only">{children}</span> : children}
  </th>
);

/** Celda de fila de 56px. */
export const Td: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`h-14 py-2 px-2.5 first:pl-6 last:pr-6 text-sm text-[#1C2430] align-middle ${className}`}>{children}</td>
);

/** Círculo con iniciales (decorativo: el nombre va al lado). */
export const Initials: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'sm' }) => (
  <span
    aria-hidden="true"
    className={`${size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs'} shrink-0 rounded-full bg-[#E6F2F1] text-[#0F6E6E] font-bold flex items-center justify-center`}
  >
    {initialsOf(name)}
  </span>
);

/** Acción de texto dentro de una fila ("Editar", "Desactivar"). */
export const TextAction: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'action' | 'muted' | 'danger' }
> = ({ tone = 'action', className = '', children, ...rest }) => {
  const tones = {
    action: 'text-[#0F6E6E] hover:text-[#0B5858]',
    muted: 'text-[#5B6573] hover:text-[#1C2430]',
    danger: 'text-[#B42318] hover:text-[#912018]',
  };
  return (
    <button
      className={`min-h-[40px] px-2 rounded-md text-sm font-semibold whitespace-nowrap hover:underline focus-ring-custom transition-colors duration-150 disabled:opacity-50 ${tones[tone]} ${className}`}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
};

/** Separador vertical entre dos acciones de texto. */
export const ActionDivider: React.FC = () => <span aria-hidden="true" className="h-4 w-px bg-[#D9DDE3]" />;

export interface ErrorMessage {
  title: string;
  description: string;
}

/**
 * Traduce un error sin campo concreto a un banner. Red caída o 5xx → mensaje de conexión (la
 * sesión no se cierra); cualquier otro → el `detail` de la API.
 */
export function toErrorMessage(error: unknown): ErrorMessage {
  if (error instanceof ApiError && !error.isConnectionProblem && error.detail) {
    return { title: 'No se pudo completar la acción', description: error.detail };
  }
  return { title: 'Error de conexión', description: CONNECTION_ERROR_MESSAGE };
}

/** Red caída o 5xx al cargar: banner de conexión con "Reintentar". No cierra la sesión. */
export const LoadErrorBanner: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <AlertBanner description={CONNECTION_ERROR_MESSAGE} title="Error de conexión">
    <div>
      <Button fullWidth={false} leadingIcon="refresh" onClick={onRetry} size="sm" type="button" variant="secondary">
        Reintentar
      </Button>
    </div>
  </AlertBanner>
);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  icon: string;
  message: string;
  /** Nombre del elemento afectado, bajo el título. */
  target?: string;
  confirmText: string;
  busyText: string;
  busy: boolean;
  error?: ErrorMessage | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmación de desactivar (especialidad o profesional). */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  icon,
  message,
  target,
  confirmText,
  busyText,
  busy,
  error,
  onConfirm,
  onClose,
}) => (
  <Modal
    busy={busy}
    footer={
      <>
        <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
          Cancelar
        </Button>
        <Button fullWidth={false} isLoading={busy} loadingText={busyText} onClick={onConfirm} type="button" variant="danger">
          {confirmText}
        </Button>
      </>
    }
    icon={icon}
    iconTone="danger"
    maxWidth="480px"
    onClose={onClose}
    open={open}
    subtitle={target}
    title={title}
  >
    <div className="flex flex-col gap-4">
      {error && <AlertBanner description={error.description} title={error.title} />}
      <p className="text-base text-[#1C2430]">{message}</p>
    </div>
  </Modal>
);
