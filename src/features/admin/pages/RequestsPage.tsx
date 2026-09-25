import React, { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { EmptyState, PageHeader, SiteBadge, SkeletonRows } from '../../../shared/components/Feedback';
import { useToast } from '../../../shared/components/Toast';
import { useShell } from '../../../shared/layout/AppShell';
import { adminApi, AppointmentRequest } from '../api/adminApi';
import { useRemoteData } from '../api/useRemoteData';
import { Initials, LoadErrorBanner, TableCard, Td, Th } from '../components/AdminUi';
import { formatDate, formatDuration, formatTimeRange } from '../components/format';
import { ApproveDialog, RejectDialog } from '../components/RequestDialogs';

type Decision = { kind: 'approve' | 'reject'; request: AppointmentRequest };

interface RowActionsProps {
  request: AppointmentRequest;
  onDecide: (decision: Decision) => void;
  /** Tarjeta móvil: botones de 48px a ancho completo. */
  stacked?: boolean;
}

const RowActions: React.FC<RowActionsProps> = ({ request, onDecide, stacked = false }) => {
  const label = `${request.patientName}, ${formatDate(request.date)} ${request.startTime.slice(0, 5)}`;
  return (
    <div className={stacked ? 'grid grid-cols-2 gap-3' : 'flex items-center justify-end gap-2'}>
      <Button
        aria-label={`Aprobar solicitud de ${label}`}
        fullWidth={stacked}
        leadingIcon="check"
        onClick={() => onDecide({ kind: 'approve', request })}
        size={stacked ? 'md' : 'sm'}
        type="button"
      >
        Aprobar
      </Button>
      <Button
        aria-label={`Rechazar solicitud de ${label}`}
        fullWidth={stacked}
        onClick={() => onDecide({ kind: 'reject', request })}
        size={stacked ? 'md' : 'sm'}
        type="button"
        variant="secondary"
      >
        Rechazar
      </Button>
    </div>
  );
};

/** Solicitudes de cita especializada pendientes de decisión del ADMIN (HU-015). */
export const RequestsPage: React.FC = () => {
  const { status, data: requests, setData: setRequests, reload } = useRemoteData(adminApi.listRequests, []);
  const [decision, setDecision] = useState<Decision | null>(null);
  const { showToast } = useToast();
  const { refreshPendingCount } = useShell();

  const handleResolved = (id: number, kind: Decision['kind']) => {
    setDecision(null);
    setRequests((current) => current.filter((r) => r.id !== id));
    showToast(
      kind === 'approve'
        ? 'Cita aprobada. El horario queda confirmado para el paciente.'
        : 'Solicitud rechazada. Los horarios quedaron libres.',
    );
    refreshPendingCount();
  };

  const handleRefreshList = () => {
    setDecision(null);
    void reload();
    refreshPendingCount();
  };

  return (
    <>
      <PageHeader subtitle="Citas especializadas que esperan tu decisión." title="Solicitudes pendientes" />

      {status === 'error' ? (
        <LoadErrorBanner onRetry={() => void reload()} />
      ) : (
        <TableCard>
          {status === 'loading' ? (
            <SkeletonRows label="Cargando solicitudes…" rows={3} />
          ) : requests.length === 0 ? (
            <EmptyState
              description="Cuando un paciente solicite una cita especializada aparecerá aquí."
              icon="inbox"
              title="No hay solicitudes pendientes"
            />
          ) : (
            <>
              {/* Escritorio y tablet: tabla. Las acciones nunca se recortan (ancho intrínseco). */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9DDE3]">
                      <Th>Paciente</Th>
                      <Th>Especialidad</Th>
                      <Th>Profesional</Th>
                      <Th>Sede</Th>
                      <Th>Fecha</Th>
                      <Th>Hora</Th>
                      <Th>Duración</Th>
                      <Th className="w-px text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b border-[#D9DDE3] last:border-b-0">
                        <Td>
                          <span className="flex items-center gap-2.5 font-semibold whitespace-nowrap">
                            <Initials name={request.patientName} />
                            {request.patientName}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap">{request.specialtyName}</Td>
                        <Td className="text-[#5B6573]">{request.professionalName}</Td>
                        <Td>
                          <SiteBadge code={request.siteCode} />
                        </Td>
                        <Td className="whitespace-nowrap tabular-nums">{formatDate(request.date)}</Td>
                        <Td className="whitespace-nowrap tabular-nums">
                          {formatTimeRange(request.startTime, request.endTime)}
                        </Td>
                        <Td className="whitespace-nowrap text-[#5B6573]">{formatDuration(request.durationMinutes)}</Td>
                        <Td className="w-px whitespace-nowrap">
                          <RowActions onDecide={setDecision} request={request} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil: cada fila es una tarjeta con acciones a ancho completo. */}
              <ul aria-label="Solicitudes pendientes" className="md:hidden divide-y divide-[#D9DDE3]">
                {requests.map((request) => (
                  <li key={request.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Initials name={request.patientName} size="md" />
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[#1C2430]">{request.patientName}</p>
                        <p className="text-sm text-[#5B6573]">
                          {request.specialtyName} · {request.professionalName}
                        </p>
                      </div>
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#1C2430] tabular-nums">
                      <SiteBadge code={request.siteCode} />
                      <span>{formatDate(request.date)}</span>
                      <span>{formatTimeRange(request.startTime, request.endTime)}</span>
                      <span className="text-[#5B6573]">{formatDuration(request.durationMinutes)}</span>
                    </p>
                    <RowActions onDecide={setDecision} request={request} stacked />
                  </li>
                ))}
              </ul>
            </>
          )}
        </TableCard>
      )}

      {decision?.kind === 'approve' && (
        <ApproveDialog
          key={`approve-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={(id) => handleResolved(id, 'approve')}
          request={decision.request}
        />
      )}
      {decision?.kind === 'reject' && (
        <RejectDialog
          key={`reject-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={(id) => handleResolved(id, 'reject')}
          request={decision.request}
        />
      )}
    </>
  );
};
