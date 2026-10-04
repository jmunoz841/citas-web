import React, { useEffect, useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { SiteBadge } from '../../../shared/components/Feedback';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';
import {
  AvailabilitySlot,
  PatientAppointment,
  requestReschedule,
  RescheduleResponse,
  searchAvailability,
} from '../api/bookingApi';
import { addDays, todayIso } from '../utils/dates';

interface RescheduleFormProps {
  appointment: PatientAppointment;
  onRequested: (response: RescheduleResponse) => void;
  onCancel: () => void;
}

interface FormError {
  title: string;
  description: string;
}

/** Traduce los errores del contrato (citas.md § Reprogramación) a un banner. */
function toFormError(error: unknown): FormError {
  if (error instanceof ApiError && !error.isConnectionProblem) {
    switch (error.code) {
      case 'SLOT_UNAVAILABLE':
        return { title: 'Ese horario ya no está disponible', description: 'Otra persona lo tomó. Elige otro horario.' };
      case 'RESCHEDULE_ALREADY_PENDING':
        return {
          title: 'Ya tienes una reprogramación pendiente',
          description: 'Espera la decisión del administrador antes de pedir otra.',
        };
      case 'APPOINTMENT_NOT_RESCHEDULABLE':
        return { title: 'No se puede reprogramar', description: 'Solo se reprograman citas aprobadas.' };
      default: {
        const fieldMessage = Object.values(error.fieldErrors)[0];
        return { title: 'No se pudo enviar la solicitud', description: fieldMessage ?? error.detail ?? 'Inténtalo de nuevo.' };
      }
    }
  }
  return { title: 'Error de conexión', description: CONNECTION_ERROR_MESSAGE };
}

const slotKey = (slot: AvailabilitySlot) => `${slot.siteCode}-${slot.date}-${slot.startTime}`;

/**
 * Solicitud de reprogramación (HU-018): mismo profesional y especialidad, nueva fecha y hora.
 * La cita conserva su horario hasta que el ADMIN decida.
 */
export const RescheduleForm: React.FC<RescheduleFormProps> = ({ appointment, onRequested, onCancel }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!date) return undefined;
    let active = true;
    setSlotsStatus('loading');
    setSelected(null);
    searchAvailability({ date, professionalId: appointment.professionalId, specialtyId: appointment.specialtyId })
      .then((result) => {
        if (!active) return;
        setSlots(result);
        setSlotsStatus('ready');
      })
      .catch(() => {
        if (active) setSlotsStatus('error');
      });
    return () => {
      active = false;
    };
  }, [date, appointment.professionalId, appointment.specialtyId, reloadToken]);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await requestReschedule(appointment.id, {
        siteCode: selected.siteCode,
        date: selected.date,
        startTime: selected.startTime,
      });
      onRequested(response);
    } catch (err) {
      setError(toFormError(err));
      // Si el horario se ocupó mientras tanto, se refrescan las opciones.
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') setReloadToken((value) => value + 1);
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="reschedule-title" className="mt-5 border-t border-[#D9DDE3] pt-4 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-[#1C2430]" id="reschedule-title">
          Reprogramar cita
        </h3>
        <p className="mt-1 text-sm text-[#5B6573]">
          Con {appointment.professionalName}, {appointment.specialtyName}. Tu cita actual se conserva hasta que el
          administrador apruebe el cambio.
        </p>
      </div>

      {error && <AlertBanner description={error.description} title={error.title} />}

      <label className="flex flex-col gap-1 text-sm font-semibold text-[#1C2430] sm:max-w-xs">
        Nueva fecha
        <input
          className="h-11 rounded-lg border border-[#D9DDE3] bg-white px-3 text-base font-normal focus-ring-custom"
          min={todayIso()}
          max={addDays(todayIso(), 90)}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          value={date}
        />
      </label>

      {slotsStatus === 'loading' && (
        <p className="text-sm text-[#5B6573]" role="status">
          Buscando horarios disponibles…
        </p>
      )}
      {slotsStatus === 'error' && (
        <AlertBanner description={CONNECTION_ERROR_MESSAGE} title="No pudimos cargar los horarios" />
      )}
      {slotsStatus === 'ready' && slots.length === 0 && (
        <p className="text-sm text-[#5B6573]">No hay horarios disponibles ese día. Prueba con otra fecha.</p>
      )}
      {slotsStatus === 'ready' && slots.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-[#1C2430] mb-2">Horarios disponibles</legend>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const isSelected = selected !== null && slotKey(selected) === slotKey(slot);
              return (
                <label
                  key={slotKey(slot)}
                  className={`min-h-[48px] px-3 inline-flex items-center gap-2 rounded-lg border cursor-pointer text-sm tabular-nums focus-within:ring-[3px] focus-within:ring-[#2B8C8C] ${
                    isSelected ? 'border-[#0F6E6E] bg-[#E6F2F1] font-semibold' : 'border-[#D9DDE3] bg-white'
                  }`}
                >
                  <input
                    checked={isSelected}
                    className="sr-only"
                    name="reschedule-slot"
                    onChange={() => setSelected(slot)}
                    type="radio"
                    value={slotKey(slot)}
                  />
                  {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                  <SiteBadge code={slot.siteCode} />
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <Button disabled={submitting} fullWidth={false} onClick={onCancel} type="button" variant="secondary">
          Volver
        </Button>
        <Button
          disabled={!selected}
          fullWidth={false}
          isLoading={submitting}
          leadingIcon="event_repeat"
          loadingText="Enviando…"
          onClick={() => void submit()}
          type="button"
        >
          Solicitar reprogramación
        </Button>
      </div>
    </section>
  );
};
