import React, { useEffect, useState } from 'react';
import { AppointmentStatus, cancelMyAppointment, fetchMyAppointment, fetchMyAppointments, PatientAppointment } from '../api/bookingApi';
import { Button } from '../../../shared/components/Button';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { EmptyState, PageHeader, SiteBadge, SkeletonRows } from '../../../shared/components/Feedback';
import { LoadErrorBanner, TableCard, Td, TextAction, Th } from '../../admin/components/AdminUi';
import { formatDate, formatDuration, formatTimeRange } from '../../admin/components/format';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  APPROVED: 'Aprobada',
  REQUESTED: 'En solicitud',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistio',
};

const STATUS_TONE: Record<AppointmentStatus, string> = {
  APPROVED: 'bg-[#E6F2F1] text-[#0F6E6E]',
  REQUESTED: 'bg-[#FFF8ED] text-[#A15C00]',
  REJECTED: 'bg-[#FDECEC] text-[#B42318]',
  CANCELLED: 'bg-[#EEF0F2] text-[#5B6573]',
  COMPLETED: 'bg-[#E6F2F1] text-[#0F6E6E]',
  NO_SHOW: 'bg-[#FDECEC] text-[#B42318]',
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}

/** Listado y detalle de las citas del USER (HU-016). */
export const MyAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<PatientAppointment | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [retryToken, setRetryToken] = useState(0);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus('loading');
    fetchMyAppointments({ status: statusFilter || undefined, from: from || undefined, to: to || undefined })
      .then((result) => {
        if (!cancelled) {
          setItems(result);
          setLoadStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadStatus('error');
      });
    return () => { cancelled = true; };
  }, [statusFilter, from, to, retryToken]);

  const showDetail = (id: number) => {
    setConfirmingCancel(false);
    setDetailStatus('loading');
    setSelected(null);
    fetchMyAppointment(id)
      .then((appointment) => {
        setSelected(appointment);
        setDetailStatus('idle');
      })
      .catch(() => setDetailStatus('error'));
  };

  const cancelSelected = () => {
    if (!selected) return;
    setCancelling(true);
    cancelMyAppointment(selected.id).then((result) => {
      const cancelled = { ...selected, status: result.status };
      setSelected(cancelled);
      setItems((current) => current.map((item) => item.id === cancelled.id ? cancelled : item));
      setConfirmingCancel(false);
    }).catch(() => setDetailStatus('error')).finally(() => setCancelling(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader subtitle="Consulta el estado y los detalles de tus atenciones." title="Mis citas" />

      <section aria-label="Filtros de citas" className="bg-white border border-[#D9DDE3] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Estado
          <select aria-label="Filtrar por estado" className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Desde
          <input aria-label="Fecha inicial" className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal" onChange={(e) => setFrom(e.target.value)} type="date" value={from} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Hasta
          <input aria-label="Fecha final" className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal" onChange={(e) => setTo(e.target.value)} type="date" value={to} />
        </label>
      </section>

      {loadStatus === 'error' ? <LoadErrorBanner onRetry={() => setRetryToken((value) => value + 1)} /> : (
        <TableCard>
          {loadStatus === 'loading' ? <SkeletonRows label="Cargando tus citas" rows={3} /> : items.length === 0 ? (
            <EmptyState description="Cuando agendes una cita, podras consultarla aqui." icon="calendar_month" title="No tienes citas para estos filtros" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-[#D9DDE3]"><Th>Especialidad</Th><Th>Profesional</Th><Th>Sede</Th><Th>Fecha y hora</Th><Th>Estado</Th><Th srOnly>Detalle</Th></tr></thead>
                <tbody>{items.map((appointment) => <tr key={appointment.id} className="border-b border-[#D9DDE3] last:border-b-0"><Td className="font-semibold whitespace-nowrap">{appointment.specialtyName}</Td><Td>{appointment.professionalName}</Td><Td><SiteBadge code={appointment.siteCode} title={appointment.siteName} /></Td><Td className="whitespace-nowrap tabular-nums">{formatDate(appointment.date)}<br /><span className="text-[#5B6573]">{formatTimeRange(appointment.startTime, appointment.endTime)}</span></Td><Td><StatusBadge status={appointment.status} /></Td><Td className="w-px"><TextAction aria-label={`Ver detalle de ${appointment.specialtyName}`} onClick={() => showDetail(appointment.id)}>Ver detalle</TextAction></Td></tr>)}</tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {detailStatus === 'loading' && <div aria-busy="true" className="h-28 rounded-xl bg-white border border-[#D9DDE3] animate-pulse" role="status"><span className="sr-only">Cargando detalle</span></div>}
      {detailStatus === 'error' && <AlertBanner description="No pudimos cargar el detalle de esta cita." title="Error de conexion" />}
      {selected && <section aria-label="Detalle de cita" className="bg-white border border-[#D9DDE3] rounded-xl p-5 shadow-[0_2px_8px_rgba(28,36,48,0.06)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-[#1C2430]">{selected.specialtyName}</h2><p className="text-[#5B6573] mt-1">{selected.professionalName} · {selected.siteName}</p></div><StatusBadge status={selected.status} /></div><dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-sm"><div><dt className="text-[#5B6573]">Fecha y hora</dt><dd className="font-semibold mt-1">{formatDate(selected.date)} · {formatTimeRange(selected.startTime, selected.endTime)}</dd></div><div><dt className="text-[#5B6573]">Duracion</dt><dd className="font-semibold mt-1">{formatDuration(selected.durationMinutes)}</dd></div></dl>{selected.rejectionReason && <AlertBanner description={selected.rejectionReason} title="Motivo de rechazo" />}{(selected.status === 'REQUESTED' || selected.status === 'APPROVED') && <div className="mt-5 flex flex-wrap gap-3">{confirmingCancel ? <><p className="w-full text-sm text-[#5B6573]">Al cancelar, el horario volvera a estar disponible.</p><Button disabled={cancelling} fullWidth={false} onClick={() => setConfirmingCancel(false)} type="button" variant="secondary">Volver</Button><Button fullWidth={false} isLoading={cancelling} loadingText="Cancelando..." onClick={cancelSelected} type="button" variant="danger">Confirmar cancelacion</Button></> : <Button fullWidth={false} onClick={() => setConfirmingCancel(true)} type="button" variant="danger">Cancelar cita</Button>}</div>}</section>}
    </div>
  );
};
