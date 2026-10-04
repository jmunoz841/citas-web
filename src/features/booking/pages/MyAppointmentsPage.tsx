import React, { useEffect, useState } from "react";
import {
  AppointmentHistoryEntry,
  AppointmentStatus,
  cancelMyAppointment,
  fetchMyAppointment,
  fetchMyAppointmentHistory,
  fetchMyAppointments,
  PatientAppointment,
  RescheduleInfo,
  RescheduleResponse,
} from "../api/bookingApi";
import { RescheduleForm } from "../components/RescheduleForm";
import { Button } from "../../../shared/components/Button";
import { AlertBanner } from "../../../shared/components/AlertBanner";
import {
  EmptyState,
  PageHeader,
  SiteBadge,
  SkeletonRows,
} from "../../../shared/components/Feedback";
import {
  LoadErrorBanner,
  TableCard,
  Td,
  TextAction,
  Th,
} from "../../admin/components/AdminUi";
import {
  formatDate,
  formatDuration,
  formatTimeRange,
} from "../../admin/components/format";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  APPROVED: "Aprobada",
  REQUESTED: "En solicitud",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistio",
};

const STATUS_TONE: Record<AppointmentStatus, string> = {
  APPROVED: "bg-[#E6F2F1] text-[#0F6E6E]",
  REQUESTED: "bg-[#FFF8ED] text-[#A15C00]",
  REJECTED: "bg-[#FDECEC] text-[#B42318]",
  CANCELLED: "bg-[#EEF0F2] text-[#5B6573]",
  COMPLETED: "bg-[#E6F2F1] text-[#0F6E6E]",
  NO_SHOW: "bg-[#FDECEC] text-[#B42318]",
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** "08/10/2026 14:00 · ICV" */
function describeRequested(reschedule: RescheduleInfo): string {
  return `${formatDate(reschedule.requestedDate)} ${reschedule.requestedStartTime.slice(0, 5)} · ${reschedule.requestedSiteCode}`;
}

/** Estado y motivo de la última reprogramación (HU-018, HU-019). */
function RescheduleStatusBanner({ reschedule }: { reschedule: RescheduleInfo }) {
  const requested = describeRequested(reschedule);
  switch (reschedule.status) {
    case "PENDING":
      return (
        <AlertBanner
          className="mt-4"
          description={`Pediste cambiar tu cita al ${requested}. Conservas tu horario actual hasta que el administrador decida.`}
          title="Reprogramación pendiente de aprobación"
          tone="info"
        />
      );
    case "APPROVED":
      return (
        <AlertBanner
          className="mt-4"
          description={`Tu cita se movió al ${requested}.`}
          title="Reprogramación aprobada"
          tone="success"
        />
      );
    case "REJECTED":
      return (
        <AlertBanner
          className="mt-4"
          description={`${reschedule.decisionReason ?? "Sin motivo"}. Conservas tu horario actual.`}
          title="Reprogramación rechazada"
          tone="warning"
        />
      );
    case "CANCELLED":
      return (
        <AlertBanner
          className="mt-4"
          description={`Tu solicitud para el ${requested} se cerró sin decisión porque la cita se canceló o llegó la hora antes de que el administrador respondiera.`}
          title="Reprogramación cerrada"
          tone="warning"
        />
      );
    default:
      return null;
  }
}

/** Una cita aprobada y futura sin solicitud pendiente se puede reprogramar (HU-018). */
function canReschedule(appointment: PatientAppointment, now: Date = new Date()): boolean {
  if (appointment.status !== "APPROVED") return false;
  if (appointment.reschedule?.status === "PENDING") return false;
  return new Date(`${appointment.date}T${appointment.startTime}`) > now;
}

/** Listado y detalle de las citas del USER (HU-016, HU-017, HU-018). */
export const MyAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [selected, setSelected] = useState<PatientAppointment | null>(null);
  const [detailStatus, setDetailStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [retryToken, setRetryToken] = useState(0);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [history, setHistory] = useState<AppointmentHistoryEntry[]>([]);
  const [rescheduling, setRescheduling] = useState(false);

  const replaceSelected = (updated: PatientAppointment) => {
    setSelected(updated);
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  };

  const handleRescheduleRequested = (response: RescheduleResponse) => {
    if (!selected) return;
    setRescheduling(false);
    replaceSelected({
      ...selected,
      reschedule: {
        id: response.id,
        status: response.status,
        requestedDate: response.requestedDate,
        requestedStartTime: response.requestedStartTime,
        requestedSiteCode: response.requestedSiteCode,
        decisionReason: null,
      },
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    fetchMyAppointments({
      status: statusFilter || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setItems(result);
          setLoadStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, from, to, retryToken]);

  const showDetail = (id: number) => {
    setConfirmingCancel(false);
    setRescheduling(false);
    setDetailStatus("loading");
    setSelected(null);
    Promise.all([fetchMyAppointment(id), fetchMyAppointmentHistory(id)])
      .then(([appointment, entries]) => {
        setSelected(appointment);
        setHistory(entries);
        setDetailStatus("idle");
      })
      .catch(() => setDetailStatus("error"));
  };

  const cancelSelected = () => {
    if (!selected) return;
    setCancelling(true);
    cancelMyAppointment(selected.id)
      .then((result) => {
        // Cancelar la cita también cancela su reprogramación pendiente (D-033).
        const reschedule: RescheduleInfo | null =
          selected.reschedule?.status === "PENDING"
            ? { ...selected.reschedule, status: "CANCELLED" }
            : (selected.reschedule ?? null);
        replaceSelected({ ...selected, status: result.status, reschedule });
        setConfirmingCancel(false);
      })
      .catch(() => setDetailStatus("error"))
      .finally(() => setCancelling(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        subtitle="Consulta el estado y los detalles de tus atenciones."
        title="Mis citas"
      />

      <section
        aria-label="Filtros de citas"
        className="bg-white border border-[#D9DDE3] rounded-xl p-4 flex flex-col sm:flex-row gap-3"
      >
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Estado
          <select
            aria-label="Filtrar por estado"
            className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AppointmentStatus | "")
            }
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Desde
          <input
            aria-label="Fecha inicial"
            className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal"
            onChange={(e) => setFrom(e.target.value)}
            type="date"
            value={from}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430]">
          Hasta
          <input
            aria-label="Fecha final"
            className="h-11 rounded-lg border border-[#D9DDE3] px-3 font-normal"
            onChange={(e) => setTo(e.target.value)}
            type="date"
            value={to}
          />
        </label>
      </section>

      {loadStatus === "error" ? (
        <LoadErrorBanner onRetry={() => setRetryToken((value) => value + 1)} />
      ) : (
        <TableCard>
          {loadStatus === "loading" ? (
            <SkeletonRows label="Cargando tus citas" rows={3} />
          ) : items.length === 0 ? (
            <EmptyState
              description="Cuando agendes una cita, podras consultarla aqui."
              icon="calendar_month"
              title="No tienes citas para estos filtros"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#D9DDE3]">
                    <Th>Especialidad</Th>
                    <Th>Profesional</Th>
                    <Th>Sede</Th>
                    <Th>Fecha y hora</Th>
                    <Th>Estado</Th>
                    <Th srOnly>Detalle</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-[#D9DDE3] last:border-b-0"
                    >
                      <Td className="font-semibold whitespace-nowrap">
                        {appointment.specialtyName}
                      </Td>
                      <Td>{appointment.professionalName}</Td>
                      <Td>
                        <SiteBadge
                          code={appointment.siteCode}
                          title={appointment.siteName}
                        />
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">
                        {formatDate(appointment.date)}
                        <br />
                        <span className="text-[#5B6573]">
                          {formatTimeRange(
                            appointment.startTime,
                            appointment.endTime,
                          )}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={appointment.status} />
                        {appointment.reschedule?.status === "PENDING" && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-[#0F6E6E]">
                            <span
                              aria-hidden="true"
                              className="material-symbols-outlined text-[14px]"
                            >
                              event_repeat
                            </span>
                            Reprogramación pendiente
                          </span>
                        )}
                      </Td>
                      <Td className="w-px">
                        <TextAction
                          aria-label={`Ver detalle de ${appointment.specialtyName}`}
                          onClick={() => showDetail(appointment.id)}
                        >
                          Ver detalle
                        </TextAction>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {detailStatus === "loading" && (
        <div
          aria-busy="true"
          className="h-28 rounded-xl bg-white border border-[#D9DDE3] animate-pulse"
          role="status"
        >
          <span className="sr-only">Cargando detalle</span>
        </div>
      )}
      {detailStatus === "error" && (
        <AlertBanner
          description="No pudimos cargar el detalle de esta cita."
          title="Error de conexion"
        />
      )}
      {selected && (
        <section
          aria-label="Detalle de cita"
          className="bg-white border border-[#D9DDE3] rounded-xl p-5 shadow-[0_2px_8px_rgba(28,36,48,0.06)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1C2430]">
                {selected.specialtyName}
              </h2>
              <p className="text-[#5B6573] mt-1">
                {selected.professionalName} · {selected.siteName}
              </p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-sm">
            <div>
              <dt className="text-[#5B6573]">Fecha y hora</dt>
              <dd className="font-semibold mt-1">
                {formatDate(selected.date)} ·{" "}
                {formatTimeRange(selected.startTime, selected.endTime)}
              </dd>
            </div>
            <div>
              <dt className="text-[#5B6573]">Duracion</dt>
              <dd className="font-semibold mt-1">
                {formatDuration(selected.durationMinutes)}
              </dd>
            </div>
          </dl>
          {selected.rejectionReason && (
            <AlertBanner
              description={selected.rejectionReason}
              title="Motivo de rechazo"
            />
          )}
          {selected.reschedule && (
            <RescheduleStatusBanner reschedule={selected.reschedule} />
          )}
          <section
            aria-labelledby="history-title"
            className="mt-5 border-t border-[#D9DDE3] pt-4"
          >
            <h3 id="history-title" className="font-semibold text-[#1C2430]">
              Historial de estados
            </h3>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-[#5B6573]">
                No hay cambios de estado registrados.
              </p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {history.map((entry, index) => (
                  <li
                    key={`${entry.changedAt}-${index}`}
                    className="rounded-lg bg-[#F7F8FA] px-3 py-2"
                  >
                    <StatusBadge status={entry.status} />
                    <span className="ml-2 text-[#5B6573]">
                      {entry.source} · {entry.changedAt.replace("T", " ")}
                    </span>
                    {entry.reason && (
                      <p className="mt-1 text-[#5B6573]">{entry.reason}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
          {rescheduling && (
            <RescheduleForm
              appointment={selected}
              onCancel={() => setRescheduling(false)}
              onRequested={handleRescheduleRequested}
            />
          )}
          {!rescheduling &&
            (selected.status === "REQUESTED" ||
            selected.status === "APPROVED") && (
            <div className="mt-5 flex flex-wrap gap-3">
              {confirmingCancel ? (
                <>
                  <p className="w-full text-sm text-[#5B6573]">
                    Al cancelar, el horario volvera a estar disponible.
                  </p>
                  <Button
                    disabled={cancelling}
                    fullWidth={false}
                    onClick={() => setConfirmingCancel(false)}
                    type="button"
                    variant="secondary"
                  >
                    Volver
                  </Button>
                  <Button
                    fullWidth={false}
                    isLoading={cancelling}
                    loadingText="Cancelando..."
                    onClick={cancelSelected}
                    type="button"
                    variant="danger"
                  >
                    Confirmar cancelacion
                  </Button>
                </>
              ) : (
                <>
                  {canReschedule(selected) && (
                    <Button
                      fullWidth={false}
                      leadingIcon="event_repeat"
                      onClick={() => setRescheduling(true)}
                      type="button"
                      variant="secondary"
                    >
                      Reprogramar
                    </Button>
                  )}
                  <Button
                    fullWidth={false}
                    onClick={() => setConfirmingCancel(true)}
                    type="button"
                    variant="danger"
                  >
                    Cancelar cita
                  </Button>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
