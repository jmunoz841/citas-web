import React, { useId, useRef, useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { ApiError } from '../../../shared/api/errors';
import { adminApi, AppointmentRequest, MAX_REASON_LENGTH, RescheduleRequest } from '../api/adminApi';
import { ErrorMessage, toErrorMessage } from './AdminUi';
import { formatDate, formatDuration, formatTimeRange } from './format';

const REASON_REQUIRED = 'El motivo del rechazo es obligatorio';

/** 409: otro ADMIN ya resolvió la solicitud, o venció (D-033). */
const ConflictAlert: React.FC<{ description: string; onRefresh: () => void }> = ({ description, onRefresh }) => (
  <AlertBanner description={description} title="Esta solicitud ya fue resuelta" tone="warning">
    <div>
      <Button fullWidth={false} leadingIcon="refresh" onClick={onRefresh} size="sm" type="button" variant="secondary">
        Actualizar lista
      </Button>
    </div>
  </AlertBanner>
);

function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

interface DialogProps<T> {
  /** El padre monta el diálogo con `key` por solicitud, así cada apertura parte de cero. */
  request: T;
  onClose: () => void;
  /** La decisión quedó registrada: quitar la fila, avisar y recontar el badge. */
  onResolved: (id: number) => void;
  /** Conflicto 409: cerrar y recargar el listado. */
  onRefreshList: () => void;
}

interface ApproveDialogBaseProps {
  title: string;
  icon: string;
  confirmText: string;
  busyText: string;
  conflictText: string;
  rows: [string, string][];
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
  onResolved: () => void;
  onRefreshList: () => void;
}

const ApproveDialogBase: React.FC<ApproveDialogBaseProps> = ({
  title,
  icon,
  confirmText,
  busyText,
  conflictText,
  rows,
  onConfirm,
  onClose,
  onResolved,
  onRefreshList,
}) => {
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);

  const handleApprove = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onResolved();
    } catch (err) {
      if (isConflict(err)) setConflict(true);
      else setError(toErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      busy={busy}
      footer={
        <>
          <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={conflict}
            fullWidth={false}
            isLoading={busy}
            leadingIcon="check"
            loadingText={busyText}
            onClick={handleApprove}
            type="button"
          >
            {confirmText}
          </Button>
        </>
      }
      icon={icon}
      maxWidth="520px"
      onClose={onClose}
      open
      title={title}
    >
      <div className="flex flex-col gap-4">
        {conflict && <ConflictAlert description={conflictText} onRefresh={onRefreshList} />}
        {error && <AlertBanner description={error.description} title={error.title} />}
        <dl className="rounded-lg border border-[#D9DDE3] bg-[#F7F6F2] p-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="text-[#5B6573]">{label}</dt>
              <dd className="text-[#1C2430] font-semibold tabular-nums">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </Modal>
  );
};

interface RejectDialogBaseProps {
  title: string;
  confirmText: string;
  conflictText: string;
  subtitle: string;
  summary: React.ReactNode;
  placeholder: string;
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
  onResolved: () => void;
  onRefreshList: () => void;
}

const RejectDialogBase: React.FC<RejectDialogBaseProps> = ({
  title,
  confirmText,
  conflictText,
  subtitle,
  summary,
  placeholder,
  onConfirm,
  onClose,
  onResolved,
  onRefreshList,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<ErrorMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const counterId = `${fieldId}-counter`;

  const handleReject = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(REASON_REQUIRED);
      textareaRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    setReasonError(null);
    try {
      await onConfirm(trimmed);
      onResolved();
    } catch (err) {
      if (isConflict(err)) {
        setConflict(true);
      } else if (err instanceof ApiError && err.fieldErrors.reason) {
        setReasonError(err.fieldErrors.reason);
        textareaRef.current?.focus();
      } else {
        setError(toErrorMessage(err));
      }
      setBusy(false);
    }
  };

  const describedBy = [reasonError ? errorId : null, helperId, counterId].filter(Boolean).join(' ');

  return (
    <Modal
      busy={busy}
      footer={
        <>
          <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={conflict}
            fullWidth={false}
            isLoading={busy}
            leadingIcon="cancel"
            loadingText="Rechazando…"
            onClick={handleReject}
            type="button"
            variant="danger"
          >
            {confirmText}
          </Button>
        </>
      }
      icon="event_busy"
      iconTone="danger"
      maxWidth="520px"
      onClose={onClose}
      open
      subtitle={subtitle}
      title={title}
    >
      <div className="flex flex-col gap-5">
        {conflict && <ConflictAlert description={conflictText} onRefresh={onRefreshList} />}
        {error && <AlertBanner description={error.description} title={error.title} />}

        <div className="flex items-start gap-3 rounded-lg border border-[#D9DDE3] bg-[#F7F6F2] p-4 text-sm text-[#1C2430]">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#5B6573] shrink-0">
            calendar_month
          </span>
          <p className="tabular-nums">{summary}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label className="text-sm font-semibold text-[#1C2430]" htmlFor={fieldId}>
              Motivo del rechazo
              <span aria-hidden="true" className="text-[#B42318] ml-1">
                *
              </span>
            </label>
            <span className="text-xs text-[#5B6573] tabular-nums" id={counterId}>
              {reason.length}/{MAX_REASON_LENGTH}
            </span>
          </div>
          <span className="text-xs text-[#5B6573]" id={helperId}>
            El paciente verá este motivo. Máximo 500 caracteres.
          </span>
          <textarea
            ref={textareaRef}
            aria-describedby={describedBy}
            aria-invalid={reasonError ? 'true' : 'false'}
            aria-required="true"
            className={`w-full min-h-[120px] rounded-lg border px-4 py-3 text-base text-[#1C2430] placeholder:text-[#8E9A9D] resize-y transition-all duration-150 focus-ring-custom ${
              reasonError ? 'bg-[#FEF3F2] border-[1.5px] border-[#B42318]' : 'bg-white border-[#D9DDE3]'
            }`}
            data-autofocus
            id={fieldId}
            maxLength={MAX_REASON_LENGTH}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError && e.target.value.trim()) setReasonError(null);
            }}
            placeholder={placeholder}
            rows={4}
            value={reason}
          />
          {reasonError && (
            <div className="flex items-center gap-1 text-[#B42318] mt-0.5" id={errorId} role="alert">
              <span aria-hidden="true" className="material-symbols-outlined text-[15px] shrink-0">
                error
              </span>
              <span className="text-xs font-semibold">{reasonError}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// --- Citas especializadas (HU-015) ---

const REQUEST_CONFLICT = 'La cita ya no está pendiente de aprobación. Actualiza la lista.';

export const ApproveDialog: React.FC<DialogProps<AppointmentRequest>> = ({ request, onClose, onResolved, onRefreshList }) => (
  <ApproveDialogBase
    busyText="Aprobando…"
    confirmText="Aprobar cita"
    conflictText={REQUEST_CONFLICT}
    icon="event_available"
    onClose={onClose}
    onConfirm={() => adminApi.approve(request.id)}
    onRefreshList={onRefreshList}
    onResolved={() => onResolved(request.id)}
    rows={[
      ['Paciente', request.patientName],
      ['Especialidad', request.specialtyName],
      ['Profesional', request.professionalName],
      ['Sede', request.siteCode],
      ['Horario', `${formatDate(request.date)} ${formatTimeRange(request.startTime, request.endTime)}`],
      ['Duración', formatDuration(request.durationMinutes)],
    ]}
    title="¿Aprobar esta cita?"
  />
);

export const RejectDialog: React.FC<DialogProps<AppointmentRequest>> = ({ request, onClose, onResolved, onRefreshList }) => (
  <RejectDialogBase
    confirmText="Rechazar solicitud"
    conflictText={REQUEST_CONFLICT}
    onClose={onClose}
    onConfirm={(reason) => adminApi.reject(request.id, reason)}
    onRefreshList={onRefreshList}
    onResolved={() => onResolved(request.id)}
    placeholder="Indica de forma clara y respetuosa por qué no se puede aceptar la cita…"
    subtitle="El motivo queda registrado en el historial de la cita."
    summary={
      <>
        <span className="font-semibold">{request.patientName}</span> · {request.specialtyName} · Sede {request.siteCode} ·{' '}
        {formatDate(request.date)}, {formatTimeRange(request.startTime, request.endTime)} (
        {formatDuration(request.durationMinutes)})
      </>
    }
    title="Rechazar solicitud"
  />
);

// --- Reprogramaciones (HU-019) ---

const RESCHEDULE_CONFLICT =
  'La reprogramación ya no está pendiente: otro administrador la resolvió o llegó la hora de la cita. Actualiza la lista.';

/** "26/09/2026 09:00 · HIC" */
export function describeSlot(date: string, startTime: string, siteCode: string): string {
  return `${formatDate(date)} ${startTime.slice(0, 5)} · ${siteCode}`;
}

export const ApproveRescheduleDialog: React.FC<DialogProps<RescheduleRequest>> = ({
  request,
  onClose,
  onResolved,
  onRefreshList,
}) => (
  <ApproveDialogBase
    busyText="Aprobando…"
    confirmText="Aprobar reprogramación"
    conflictText={RESCHEDULE_CONFLICT}
    icon="event_repeat"
    onClose={onClose}
    onConfirm={() => adminApi.approveReschedule(request.id)}
    onRefreshList={onRefreshList}
    onResolved={() => onResolved(request.id)}
    rows={[
      ['Paciente', request.patientName],
      ['Especialidad', request.specialtyName],
      ['Profesional', request.professionalName],
      ['Horario actual', describeSlot(request.originalDate, request.originalStartTime, request.originalSiteCode)],
      ['Nuevo horario', describeSlot(request.requestedDate, request.requestedStartTime, request.requestedSiteCode)],
      ['Duración', formatDuration(request.durationMinutes)],
    ]}
    title="¿Aprobar esta reprogramación?"
  />
);

export const RejectRescheduleDialog: React.FC<DialogProps<RescheduleRequest>> = ({
  request,
  onClose,
  onResolved,
  onRefreshList,
}) => (
  <RejectDialogBase
    confirmText="Rechazar reprogramación"
    conflictText={RESCHEDULE_CONFLICT}
    onClose={onClose}
    onConfirm={(reason) => adminApi.rejectReschedule(request.id, reason)}
    onRefreshList={onRefreshList}
    onResolved={() => onResolved(request.id)}
    placeholder="Indica de forma clara y respetuosa por qué no se puede cambiar el horario…"
    subtitle="La cita conserva su horario actual y el paciente verá el motivo."
    summary={
      <>
        <span className="font-semibold">{request.patientName}</span> · {request.specialtyName} · de{' '}
        {describeSlot(request.originalDate, request.originalStartTime, request.originalSiteCode)} a{' '}
        {describeSlot(request.requestedDate, request.requestedStartTime, request.requestedSiteCode)}
      </>
    }
    title="Rechazar reprogramación"
  />
);
