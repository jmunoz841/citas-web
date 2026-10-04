import React, { useCallback, useEffect, useId, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { EmptyState, PageHeader, SiteBadge, SkeletonRows } from '../../../shared/components/Feedback';
import { useToast } from '../../../shared/components/Toast';
import { useShell } from '../../../shared/layout/AppShell';
import { adminApi, AppointmentRequest, InboxFilter, Professional, RescheduleRequest, Specialty } from '../api/adminApi';
import { LoadStatus } from '../api/useRemoteData';
import { Initials, LoadErrorBanner, TableCard, Td, TextAction, Th } from '../components/AdminUi';
import { formatDate, formatDuration, formatTimeRange } from '../components/format';
import {
  ApproveDialog,
  ApproveRescheduleDialog,
  describeSlot,
  RejectDialog,
  RejectRescheduleDialog,
} from '../components/RequestDialogs';

type Tab = 'requests' | 'reschedules';
type Kind = 'approve' | 'reject';
type Decision =
  | { tab: 'requests'; kind: Kind; request: AppointmentRequest }
  | { tab: 'reschedules'; kind: Kind; request: RescheduleRequest };

const SITES = ['HIC', 'ICV'];

/**
 * Carga una lista de la bandeja con los filtros vigentes; se vuelve a pedir al cambiarlos.
 * `enabled: false` no consulta (pestaña sin abrir o rango de fechas inválido).
 */
function useInboxList<T>(loader: (filter: InboxFilter) => Promise<T[]>, filter: InboxFilter, enabled: boolean) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [data, setData] = useState<T[]>([]);
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setStatus('loading');
    loader(filter)
      .then((items) => {
        if (!active) return;
        setData(items);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [loader, filter, enabled, token]);

  const reload = useCallback(() => setToken((value) => value + 1), []);
  return { status, data, setData, reload };
}

interface RowActionsProps {
  label: string;
  noun: string;
  onApprove: () => void;
  onReject: () => void;
  /** Tarjeta móvil: botones de 48px a ancho completo. */
  stacked?: boolean;
}

const RowActions: React.FC<RowActionsProps> = ({ label, noun, onApprove, onReject, stacked = false }) => (
  <div className={stacked ? 'grid grid-cols-2 gap-3' : 'flex items-center justify-end gap-2'}>
    <Button
      aria-label={`Aprobar ${noun} de ${label}`}
      fullWidth={stacked}
      leadingIcon="check"
      onClick={onApprove}
      size={stacked ? 'md' : 'sm'}
      type="button"
    >
      Aprobar
    </Button>
    <Button
      aria-label={`Rechazar ${noun} de ${label}`}
      fullWidth={stacked}
      onClick={onReject}
      size={stacked ? 'md' : 'sm'}
      type="button"
      variant="secondary"
    >
      Rechazar
    </Button>
  </div>
);

const selectClass = 'h-11 rounded-lg border border-[#D9DDE3] bg-white px-3 text-base font-normal focus-ring-custom';

interface FiltersProps {
  filter: InboxFilter;
  onChange: (filter: InboxFilter) => void;
  professionals: Professional[];
  specialties: Specialty[];
  rangeError: boolean;
}

/** HU-022 CA-02: filtros por sede, profesional, especialidad y fecha, combinables. */
const FilterField: React.FC<{ id: string; label: string; children: React.ReactNode }> = ({ id, label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-[#1C2430]" htmlFor={id}>
      {label}
    </label>
    {children}
  </div>
);

const InboxFilters: React.FC<FiltersProps> = ({ filter, onChange, professionals, specialties, rangeError }) => {
  const id = useId();
  const set = (patch: Partial<InboxFilter>) => onChange({ ...filter, ...patch });
  const hasFilters = Object.values(filter).some((value) => value !== undefined && value !== '');
  return (
    <section
      aria-label="Filtros de la bandeja"
      className="bg-white border border-[#D9DDE3] rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <FilterField id={`${id}-site`} label="Sede">
          <select
            className={selectClass}
            id={`${id}-site`}
            onChange={(e) => set({ siteCode: e.target.value || undefined })}
            value={filter.siteCode ?? ''}
          >
            <option value="">Todas las sedes</option>
            {SITES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField id={`${id}-professional`} label="Profesional">
          <select
            className={selectClass}
            id={`${id}-professional`}
            onChange={(e) => set({ professionalId: e.target.value ? Number(e.target.value) : undefined })}
            value={filter.professionalId ?? ''}
          >
            <option value="">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstNames} {p.lastNames}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField id={`${id}-specialty`} label="Especialidad">
          <select
            className={selectClass}
            id={`${id}-specialty`}
            onChange={(e) => set({ specialtyId: e.target.value ? Number(e.target.value) : undefined })}
            value={filter.specialtyId ?? ''}
          >
            <option value="">Todas las especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField id={`${id}-from`} label="Desde">
          <input
            className={selectClass}
            id={`${id}-from`}
            onChange={(e) => set({ from: e.target.value || undefined })}
            type="date"
            value={filter.from ?? ''}
          />
        </FilterField>
        <FilterField id={`${id}-to`} label="Hasta">
          <input
            aria-describedby={rangeError ? `${id}-range-error` : undefined}
            aria-invalid={rangeError ? 'true' : 'false'}
            className={`${selectClass} ${rangeError ? 'bg-[#FEF3F2] border-[1.5px] border-[#B42318]' : ''}`}
            id={`${id}-to`}
            onChange={(e) => set({ to: e.target.value || undefined })}
            type="date"
            value={filter.to ?? ''}
          />
        </FilterField>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {rangeError ? (
          <p className="text-xs font-semibold text-[#B42318]" id={`${id}-range-error`} role="alert">
            La fecha final debe ser igual o posterior a la inicial.
          </p>
        ) : (
          <span />
        )}
        {hasFilters && (
          <TextAction onClick={() => onChange({})} tone="muted">
            Limpiar filtros
          </TextAction>
        )}
      </div>
    </section>
  );
};

/** Bandeja del ADMIN: citas especializadas solicitadas y reprogramaciones pendientes (HU-015, HU-019, HU-022). */
export const RequestsPage: React.FC = () => {
  const [filter, setFilter] = useState<InboxFilter>({});
  const [tab, setTab] = useState<Tab>('requests');
  const [reschedulesOpened, setReschedulesOpened] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const { showToast } = useToast();
  const { refreshPendingCount } = useShell();

  const rangeError = Boolean(filter.from && filter.to && filter.from > filter.to);
  const requests = useInboxList(adminApi.listRequests, filter, !rangeError);
  const reschedules = useInboxList(adminApi.listReschedules, filter, reschedulesOpened && !rangeError);

  // Las opciones de los filtros son una ayuda: si fallan, los filtros quedan con "Todos".
  useEffect(() => {
    let active = true;
    void Promise.allSettled([adminApi.listProfessionals(), adminApi.listSpecialties()]).then(([p, s]) => {
      if (!active) return;
      if (p.status === 'fulfilled') setProfessionals(p.value);
      if (s.status === 'fulfilled') setSpecialties(s.value);
    });
    return () => {
      active = false;
    };
  }, []);

  const openTab = (next: Tab) => {
    setTab(next);
    if (next === 'reschedules') setReschedulesOpened(true);
  };

  const handleResolved = (resolved: Decision) => {
    setDecision(null);
    if (resolved.tab === 'requests') {
      requests.setData((current) => current.filter((r) => r.id !== resolved.request.id));
      showToast(
        resolved.kind === 'approve'
          ? 'Cita aprobada. El horario queda confirmado para el paciente.'
          : 'Solicitud rechazada. Los horarios quedaron libres.',
      );
    } else {
      reschedules.setData((current) => current.filter((r) => r.id !== resolved.request.id));
      showToast(
        resolved.kind === 'approve'
          ? 'Reprogramación aprobada. La cita quedó en el nuevo horario.'
          : 'Reprogramación rechazada. La cita conserva su horario.',
      );
    }
    refreshPendingCount();
  };

  const handleRefreshList = () => {
    setDecision(null);
    if (decision?.tab === 'reschedules') reschedules.reload();
    else requests.reload();
    refreshPendingCount();
  };

  const tabButton = (value: Tab, label: string, icon: string) => (
    <button
      aria-controls={`panel-${value}`}
      aria-selected={tab === value}
      className={`min-h-[48px] px-4 flex items-center gap-2 border-b-2 text-sm font-semibold focus-ring-custom transition-colors duration-150 ${
        tab === value ? 'border-[#0F6E6E] text-[#0F6E6E]' : 'border-transparent text-[#5B6573] hover:text-[#1C2430]'
      }`}
      id={`tab-${value}`}
      onClick={() => openTab(value)}
      role="tab"
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <>
      <PageHeader subtitle="Citas especializadas y reprogramaciones que esperan tu decisión." title="Solicitudes pendientes" />

      <div className="flex flex-col gap-4">
        <InboxFilters
          filter={filter}
          onChange={setFilter}
          professionals={professionals}
          rangeError={rangeError}
          specialties={specialties}
        />

        <div aria-label="Tipo de solicitud" className="flex border-b border-[#D9DDE3]" role="tablist">
          {tabButton('requests', 'Citas especializadas', 'inbox')}
          {tabButton('reschedules', 'Reprogramaciones', 'event_repeat')}
        </div>

        {tab === 'requests' && (
          <div aria-labelledby="tab-requests" id="panel-requests" role="tabpanel">
            {requests.status === 'error' ? (
              <LoadErrorBanner onRetry={requests.reload} />
            ) : (
              <TableCard>
                {requests.status === 'loading' ? (
                  <SkeletonRows label="Cargando solicitudes…" rows={3} />
                ) : requests.data.length === 0 ? (
                  <EmptyState
                    description="Cuando un paciente solicite una cita especializada aparecerá aquí."
                    icon="inbox"
                    title="No hay solicitudes pendientes"
                  />
                ) : (
                  <RequestsTable items={requests.data} onDecide={(kind, request) => setDecision({ tab: 'requests', kind, request })} />
                )}
              </TableCard>
            )}
          </div>
        )}

        {tab === 'reschedules' && (
          <div aria-labelledby="tab-reschedules" id="panel-reschedules" role="tabpanel">
            {reschedules.status === 'error' ? (
              <LoadErrorBanner onRetry={reschedules.reload} />
            ) : (
              <TableCard>
                {reschedules.status === 'loading' ? (
                  <SkeletonRows label="Cargando reprogramaciones…" rows={3} />
                ) : reschedules.data.length === 0 ? (
                  <EmptyState
                    description="Cuando un paciente pida cambiar el horario de una cita aprobada aparecerá aquí."
                    icon="event_repeat"
                    title="No hay reprogramaciones pendientes"
                  />
                ) : (
                  <ReschedulesTable
                    items={reschedules.data}
                    onDecide={(kind, request) => setDecision({ tab: 'reschedules', kind, request })}
                  />
                )}
              </TableCard>
            )}
          </div>
        )}
      </div>

      {decision?.tab === 'requests' && decision.kind === 'approve' && (
        <ApproveDialog
          key={`approve-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={() => handleResolved(decision)}
          request={decision.request}
        />
      )}
      {decision?.tab === 'requests' && decision.kind === 'reject' && (
        <RejectDialog
          key={`reject-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={() => handleResolved(decision)}
          request={decision.request}
        />
      )}
      {decision?.tab === 'reschedules' && decision.kind === 'approve' && (
        <ApproveRescheduleDialog
          key={`approve-r-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={() => handleResolved(decision)}
          request={decision.request}
        />
      )}
      {decision?.tab === 'reschedules' && decision.kind === 'reject' && (
        <RejectRescheduleDialog
          key={`reject-r-${decision.request.id}`}
          onClose={() => setDecision(null)}
          onRefreshList={handleRefreshList}
          onResolved={() => handleResolved(decision)}
          request={decision.request}
        />
      )}
    </>
  );
};

const RequestsTable: React.FC<{
  items: AppointmentRequest[];
  onDecide: (kind: Kind, request: AppointmentRequest) => void;
}> = ({ items, onDecide }) => {
  const label = (r: AppointmentRequest) => `${r.patientName}, ${formatDate(r.date)} ${r.startTime.slice(0, 5)}`;
  return (
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
            {items.map((request) => (
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
                <Td className="whitespace-nowrap tabular-nums">{formatTimeRange(request.startTime, request.endTime)}</Td>
                <Td className="whitespace-nowrap text-[#5B6573]">{formatDuration(request.durationMinutes)}</Td>
                <Td className="w-px whitespace-nowrap">
                  <RowActions
                    label={label(request)}
                    noun="solicitud"
                    onApprove={() => onDecide('approve', request)}
                    onReject={() => onDecide('reject', request)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: cada fila es una tarjeta con acciones a ancho completo. */}
      <ul aria-label="Solicitudes pendientes" className="md:hidden divide-y divide-[#D9DDE3]">
        {items.map((request) => (
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
            <RowActions
              label={label(request)}
              noun="solicitud"
              onApprove={() => onDecide('approve', request)}
              onReject={() => onDecide('reject', request)}
              stacked
            />
          </li>
        ))}
      </ul>
    </>
  );
};

const ReschedulesTable: React.FC<{
  items: RescheduleRequest[];
  onDecide: (kind: Kind, request: RescheduleRequest) => void;
}> = ({ items, onDecide }) => {
  const label = (r: RescheduleRequest) =>
    `${r.patientName}, ${formatDate(r.requestedDate)} ${r.requestedStartTime.slice(0, 5)}`;
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#D9DDE3]">
              <Th>Paciente</Th>
              <Th>Especialidad</Th>
              <Th>Profesional</Th>
              <Th>Horario actual</Th>
              <Th>Nuevo horario</Th>
              <Th>Duración</Th>
              <Th className="w-px text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((request) => (
              <tr key={request.id} className="border-b border-[#D9DDE3] last:border-b-0">
                <Td>
                  <span className="flex items-center gap-2.5 font-semibold whitespace-nowrap">
                    <Initials name={request.patientName} />
                    {request.patientName}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{request.specialtyName}</Td>
                <Td className="text-[#5B6573]">{request.professionalName}</Td>
                <Td className="whitespace-nowrap tabular-nums text-[#5B6573]">
                  {describeSlot(request.originalDate, request.originalStartTime, request.originalSiteCode)}
                </Td>
                <Td className="whitespace-nowrap tabular-nums font-semibold">
                  {describeSlot(request.requestedDate, request.requestedStartTime, request.requestedSiteCode)}
                </Td>
                <Td className="whitespace-nowrap text-[#5B6573]">{formatDuration(request.durationMinutes)}</Td>
                <Td className="w-px whitespace-nowrap">
                  <RowActions
                    label={label(request)}
                    noun="reprogramación"
                    onApprove={() => onDecide('approve', request)}
                    onReject={() => onDecide('reject', request)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label="Reprogramaciones pendientes" className="md:hidden divide-y divide-[#D9DDE3]">
        {items.map((request) => (
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
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm tabular-nums">
              <dt className="text-[#5B6573]">Actual</dt>
              <dd>{describeSlot(request.originalDate, request.originalStartTime, request.originalSiteCode)}</dd>
              <dt className="text-[#5B6573]">Nuevo</dt>
              <dd className="font-semibold">
                {describeSlot(request.requestedDate, request.requestedStartTime, request.requestedSiteCode)}
              </dd>
            </dl>
            <RowActions
              label={label(request)}
              noun="reprogramación"
              onApprove={() => onDecide('approve', request)}
              onReject={() => onDecide('reject', request)}
              stacked
            />
          </li>
        ))}
      </ul>
    </>
  );
};
