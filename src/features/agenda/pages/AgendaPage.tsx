import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiError, CONNECTION_ERROR_MESSAGE } from "../../../shared/api/errors";
import { AlertBanner } from "../../../shared/components/AlertBanner";
import { Button } from "../../../shared/components/Button";
import { EmptyState, PageHeader } from "../../../shared/components/Feedback";
import { useToast } from "../../../shared/components/Toast";
import {
  AvailabilityBlock,
  closeMyAppointment,
  getMyProfile,
  listMyAppointments,
  listMyBlocks,
  ProfessionalAppointment,
  ProfessionalProfile,
} from "../api/agendaApi";
import { AgendaToolbar, ALL_SITES } from "../components/AgendaToolbar";
import {
  BlockDetailsDialog,
  DeleteBlockDialog,
} from "../components/BlockDialogs";
import { BlockFormDialog } from "../components/BlockFormDialog";
import { DayView } from "../components/DayView";
import { WeekCalendar } from "../components/WeekCalendar";
import { sortBlocks } from "../utils/blocks";
import {
  addDays,
  formatWeekRange,
  isPast,
  parseIsoDate,
  startOfWeek,
  toIsoDate,
  weekDays,
} from "../utils/dates";
import { useIsMobile } from "../utils/useIsMobile";

type DialogState =
  | { kind: "none" }
  | { kind: "details"; block: AvailabilityBlock }
  | { kind: "form"; block?: AvailabilityBlock }
  | { kind: "delete"; block: AvailabilityBlock };

const INACTIVE_TITLE = "Tu cuenta profesional está inactiva";
const INACTIVE_TEXT = "No puedes publicar nuevos horarios.";

/** "Mi agenda" del PROFESSIONAL (HU-010): calendario semanal y publicación de bloques. */
export const AgendaPage: React.FC = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const todayIso = toIsoDate(new Date());

  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [appointments, setAppointments] = useState<ProfessionalAppointment[]>(
    [],
  );
  const [closingAppointmentId, setClosingAppointmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inactive, setInactive] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [siteFilter, setSiteFilter] = useState(ALL_SITES);
  const [selectedDay, setSelectedDay] = useState(todayIso);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const inactiveRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [me, own] = await Promise.all([getMyProfile(), listMyBlocks()]);
      setProfile(me);
      setInactive(!me.active);
      setBlocks(sortBlocks(own));
    } catch (err) {
      const error = err instanceof ApiError ? err : null;
      setLoadError(
        !error || error.isConnectionProblem
          ? CONNECTION_ERROR_MESSAGE
          : error.detail,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const weekIsos = useMemo(() => new Set(days.map(toIsoDate)), [days]);
  const weekBlocks = blocks.filter((b) => weekIsos.has(b.date));
  const visibleBlocks =
    siteFilter === ALL_SITES
      ? weekBlocks
      : weekBlocks.filter((b) => b.siteCode === siteFilter);
  const visibleAppointments =
    siteFilter === ALL_SITES
      ? appointments
      : appointments.filter((a) => a.siteCode === siteFilter);
  const canCloseAppointment = (appointment: ProfessionalAppointment) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return appointment.date < toIsoDate(now) || (appointment.date === toIsoDate(now) && appointment.startTime <= currentTime);
  };
  const closeAppointment = (appointment: ProfessionalAppointment, result: "COMPLETED" | "NO_SHOW") => {
    if (!canCloseAppointment(appointment)) return;
    const action = result === "COMPLETED" ? "atendida" : "no asistió";
    if (!window.confirm(`¿Confirmas que la cita de ${appointment.patientName} fue ${action}?`)) return;
    setClosingAppointmentId(appointment.id);
    void closeMyAppointment(appointment.id, result)
      .then(() => {
        setAppointments((current) => current.filter((item) => item.id !== appointment.id));
        showToast(`Cita marcada como ${action}.`);
      })
      .catch((error: unknown) => showToast(error instanceof ApiError ? error.detail : "No pudimos actualizar la cita.", "error"))
      .finally(() => setClosingAppointmentId(null));
  };
  const sites = profile?.sites ?? [];

  const goToWeek = (monday: Date) => {
    setWeekStart(monday);
    const today = toIsoDate(new Date());
    setSelectedDay(
      weekDays(monday).some((d) => toIsoDate(d) === today)
        ? today
        : toIsoDate(monday),
    );
  };

  useEffect(() => {
    const days = weekDays(weekStart);
    void listMyAppointments(
      toIsoDate(days[0]),
      toIsoDate(days[days.length - 1]),
    )
      .then(setAppointments)
      .catch(() => setAppointments([]));
  }, [weekStart]);

  // Fecha propuesta al publicar: hoy si cae en la semana visible; si no, el primer día no pasado.
  const defaultDate = () => {
    if (isMobile && selectedDay >= todayIso && weekIsos.has(selectedDay))
      return selectedDay;
    const firstFuture = days.map(toIsoDate).find((d) => d >= todayIso);
    return firstFuture ?? todayIso;
  };

  const markInactive = () => {
    setInactive(true);
    setDialog({ kind: "none" });
    requestAnimationFrame(() => inactiveRef.current?.focus());
  };

  const handleSaved = (saved: AvailabilityBlock, editing: boolean) => {
    setBlocks((prev) =>
      sortBlocks([...prev.filter((b) => b.id !== saved.id), saved]),
    );
    setDialog({ kind: "none" });
    const savedDay = parseIsoDate(saved.date);
    if (!weekIsos.has(saved.date)) goToWeek(startOfWeek(savedDay));
    else setSelectedDay(saved.date);
    if (siteFilter !== ALL_SITES && siteFilter !== saved.siteCode)
      setSiteFilter(ALL_SITES);
    showToast(editing ? "Bloque actualizado." : "Bloque publicado.");
  };

  const handleDeleted = (deleted: AvailabilityBlock) => {
    setBlocks((prev) => prev.filter((b) => b.id !== deleted.id));
    setDialog({ kind: "none" });
    showToast("Bloque eliminado.");
  };

  const openBlock = (block: AvailabilityBlock) =>
    setDialog({ kind: "details", block });
  const publishDisabled = loading || !profile || inactive || sites.length === 0;

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div
        aria-busy="true"
        className="bg-white border border-[#D9DDE3] rounded-xl p-6 flex flex-col gap-3"
        role="status"
      >
        <span className="sr-only">Cargando agenda…</span>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="h-10 rounded bg-[#EEF0F2] animate-pulse" />
        ))}
      </div>
    );
  } else if (loadError) {
    content = (
      <AlertBanner description={loadError} title="No pudimos cargar tu agenda">
        <div>
          <Button
            fullWidth={false}
            leadingIcon="refresh"
            onClick={() => void load()}
            size="sm"
            type="button"
            variant="secondary"
          >
            Reintentar
          </Button>
        </div>
      </AlertBanner>
    );
  } else if (weekBlocks.length === 0 && visibleAppointments.length === 0) {
    content = (
      <div className="bg-white border border-[#D9DDE3] rounded-xl">
        <EmptyState
          action={
            <Button
              disabled={publishDisabled}
              fullWidth={false}
              leadingIcon="add"
              onClick={() => setDialog({ kind: "form" })}
              type="button"
            >
              Publicar bloque
            </Button>
          }
          description="Publica un bloque para que los pacientes puedan reservar contigo."
          icon="calendar_month"
          title="Aún no publicas horarios esta semana"
        />
      </div>
    );
  } else if (isMobile) {
    content = (
      <DayView
        blocks={visibleBlocks}
        days={days}
        onSelectBlock={openBlock}
        onSelectDay={setSelectedDay}
        selectedDay={
          weekIsos.has(selectedDay) ? selectedDay : toIsoDate(days[0])
        }
        today={todayIso}
      />
    );
  } else {
    content = (
      <WeekCalendar
        appointments={visibleAppointments}
        blocks={visibleBlocks}
        canCloseAppointment={canCloseAppointment}
        closingAppointmentId={closingAppointmentId}
        days={days}
        onCloseAppointment={closeAppointment}
        onSelectBlock={openBlock}
        today={todayIso}
      />
    );
  }

  return (
    <div>
      <PageHeader
        subtitle="Publica los horarios en que atiendes. Cada bloque se divide en espacios de 30 minutos."
        title="Mi agenda"
      />

      {inactive && (
        <AlertBanner
          ref={inactiveRef}
          className="mb-6"
          description={INACTIVE_TEXT}
          title={INACTIVE_TITLE}
          tone="warning"
        />
      )}

      <AgendaToolbar
        onNextWeek={() => goToWeek(addDays(weekStart, 7))}
        onPrevWeek={() => goToWeek(addDays(weekStart, -7))}
        onPublish={() => setDialog({ kind: "form" })}
        onSiteFilterChange={setSiteFilter}
        onToday={() => goToWeek(startOfWeek(new Date()))}
        publishDisabled={publishDisabled}
        siteFilter={siteFilter}
        sites={sites}
        weekLabel={formatWeekRange(weekStart)}
      />

      {content}

      <section
        className="mt-6 bg-white border border-[#D9DDE3] rounded-xl p-5"
        aria-labelledby="appointments-title"
      >
        <h2
          id="appointments-title"
          className="text-lg font-semibold text-[#1C2430]"
        >
          Citas aprobadas
        </h2>
        {visibleAppointments.length === 0 ? (
          <p className="mt-2 text-sm text-[#5B6573]">
            No tienes citas aprobadas en este rango.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#D9DDE3]">
            {visibleAppointments.map((a) => (
              <li
                key={a.id}
                className="py-3 text-sm flex flex-wrap items-center gap-2"
              >
                <strong>
                  {a.startTime.slice(0, 5)} · {a.patientName}
                </strong>
                <span className="text-[#5B6573]">
                  {a.specialtyName} · {a.siteCode}
                </span>
                <Button
                  fullWidth={false}
                  size="sm"
                  disabled={!canCloseAppointment(a) || closingAppointmentId === a.id}
                  title={canCloseAppointment(a) ? undefined : "Disponible desde la hora de inicio"}
                  onClick={() => closeAppointment(a, "COMPLETED")}
                  type="button"
                >
                  Atendida
                </Button>
                <Button
                  fullWidth={false}
                  size="sm"
                  variant="secondary"
                  disabled={!canCloseAppointment(a) || closingAppointmentId === a.id}
                  title={canCloseAppointment(a) ? undefined : "Disponible desde la hora de inicio"}
                  onClick={() => closeAppointment(a, "NO_SHOW")}
                  type="button"
                >
                  No asistió
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog.kind === "details" && (
        <BlockDetailsDialog
          block={dialog.block}
          canEdit={!inactive}
          onClose={() => setDialog({ kind: "none" })}
          onDelete={() => setDialog({ kind: "delete", block: dialog.block })}
          onEdit={() => setDialog({ kind: "form", block: dialog.block })}
          past={isPast(dialog.block.date, dialog.block.startTime, new Date())}
          sites={sites}
        />
      )}
      {dialog.kind === "form" && (
        <BlockFormDialog
          block={dialog.block}
          defaultDate={defaultDate()}
          onClose={() => setDialog({ kind: "none" })}
          onInactive={markInactive}
          onSaved={(saved) => handleSaved(saved, Boolean(dialog.block))}
          sites={sites}
        />
      )}
      {dialog.kind === "delete" && (
        <DeleteBlockDialog
          block={dialog.block}
          onClose={() => setDialog({ kind: "none" })}
          onDeleted={handleDeleted}
          sites={sites}
        />
      )}
    </div>
  );
};
