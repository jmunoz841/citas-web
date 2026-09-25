import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppointmentResponse,
  AvailabilitySlot,
  createAppointment,
  fetchSpecialties,
  Site,
  Specialty,
} from '../api/bookingApi';
import { useAvailability } from '../hooks/useAvailability';
import { buildAvailabilityQuery, BookingDraft, EMPTY_DRAFT, isStepValid, slotKey } from '../utils/booking';
import { todayIso } from '../utils/dates';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { AppointmentTypeStep } from './AppointmentTypeStep';
import { BookingResult } from './BookingResult';
import { ConfirmationStep } from './ConfirmationStep';
import { DateProfessionalStep } from './DateProfessionalStep';
import { StepIndicator } from './StepIndicator';
import { SlotNotice, TimeSlotStep } from './TimeSlotStep';
import type { SummaryData } from './AppointmentSummary';

interface Props {
  sites: Site[];
  onClose: () => void;
}

/** Mensaje de un 400 que no es de horario: el del campo si lo hay, si no el general. */
function validationMessage(error: ApiError): string {
  const field = ['specialtyId', 'professionalId', 'siteCode'].find((f) => error.fieldErrors[f]);
  return (field && error.fieldErrors[field]) || Object.values(error.fieldErrors)[0] || error.detail || CONNECTION_ERROR_MESSAGE;
}

/** Modal "Agendar cita" en 4 pasos (HU-012, HU-013, HU-014). */
export const BookingModal: React.FC<Props> = ({ sites, onClose }) => {
  const today = todayIso();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const [notice, setNotice] = useState<SlotNotice>(null);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<AppointmentResponse | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtiesStatus, setSpecialtiesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [specialtiesToken, setSpecialtiesToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSpecialtiesStatus('loading');
    fetchSpecialties()
      .then((items) => {
        if (cancelled) return;
        setSpecialties(items);
        setSpecialtiesStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setSpecialtiesStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [specialtiesToken]);

  // Paso 2: opciones de profesional. Paso 3: horarios (con el profesional elegido).
  const professionalsSearch = useAvailability(step === 2 ? buildAvailabilityQuery(draft, false) : null);
  const slotsSearch = useAvailability(step === 3 && !result ? buildAvailabilityQuery(draft, true) : null);
  const visibleSlots = useMemo(
    () => slotsSearch.items.filter((slot) => !excluded.has(slotKey(slot))),
    [slotsSearch.items, excluded],
  );

  // Al cambiar de paso o mostrar el resultado, el foco va al título.
  useEffect(() => {
    bodyRef.current?.querySelector<HTMLElement>('[data-step-heading]')?.focus();
  }, [step, result]);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSubmitError(null);
  }, []);

  const goTo = (next: number) => {
    setNotice(null);
    setSubmitError(null);
    setStep(next);
  };

  const siteNames = useMemo(() => Object.fromEntries(sites.map((s) => [s.code, s.name])), [sites]);

  const summaryFor = (slot: AvailabilitySlot, booked?: AppointmentResponse): SummaryData => ({
    specialtyName: slot.specialtyName,
    durationMinutes: booked?.durationMinutes ?? slot.durationMinutes,
    professionalName: slot.professionalName,
    site: sites.find((s) => s.code === (booked?.siteCode ?? slot.siteCode)),
    siteCode: booked?.siteCode ?? slot.siteCode,
    date: booked?.date ?? slot.date,
    startTime: booked?.startTime ?? slot.startTime,
    endTime: booked?.endTime ?? slot.endTime,
    general: slot.type === 'GENERAL',
  });

  const backToSlots = (slot: AvailabilitySlot, kind: Exclude<SlotNotice, null>) => {
    setExcluded((prev) => new Set(prev).add(slotKey(slot)));
    setDraft((d) => ({ ...d, slot: null }));
    setSubmitError(null);
    setNotice(kind);
    setStep(3);
  };

  const submit = async () => {
    const slot = draft.slot;
    if (!slot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const booked = await createAppointment({
        professionalId: slot.professionalId,
        specialtyId: slot.specialtyId,
        siteCode: slot.siteCode,
        date: slot.date,
        startTime: slot.startTime,
      });
      setResult(booked);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLOT_UNAVAILABLE') {
        backToSlots(slot, 'conflict');
      } else if (err instanceof ApiError && err.status === 400 && err.fieldErrors.startTime) {
        backToSlots(slot, 'past');
      } else if (err instanceof ApiError && !err.isConnectionProblem) {
        setSubmitError(err.status === 400 ? validationMessage(err) : err.detail || CONNECTION_ERROR_MESSAGE);
      } else {
        setSubmitError(CONNECTION_ERROR_MESSAGE);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const slot = draft.slot;
  const general = slot ? slot.type === 'GENERAL' : draft.kind === 'GENERAL';

  const footer = result ? undefined : (
    <>
      <Button
        className="w-full sm:w-auto sm:mr-auto"
        disabled={step === 1 || submitting}
        fullWidth={false}
        leadingIcon="arrow_back"
        onClick={() => goTo(step - 1)}
        type="button"
        variant="secondary"
      >
        Atrás
      </Button>
      {step < 4 ? (
        <Button
          className="w-full sm:w-auto sm:px-8"
          disabled={!isStepValid(step, draft)}
          fullWidth={false}
          icon="arrow_forward"
          onClick={() => goTo(step + 1)}
          type="button"
        >
          Continuar
        </Button>
      ) : (
        <Button
          className="w-full sm:w-auto sm:px-8"
          disabled={!slot}
          fullWidth={false}
          icon="check"
          isLoading={submitting}
          loadingText="Reservando…"
          onClick={() => void submit()}
          type="button"
        >
          {general ? 'Confirmar cita' : 'Solicitar cita'}
        </Button>
      )}
    </>
  );

  return (
    <Modal busy={submitting} flushBody footer={footer} icon="calendar_add_on" maxWidth="720px" onClose={onClose} open title="Agendar cita">
      <div ref={bodyRef}>
        {result && slot ? (
          <BookingResult onDone={onClose} status={result.status} summary={summaryFor(slot, result)} />
        ) : (
          <>
            <StepIndicator current={step} />
            <div className="px-5 sm:px-8 py-6">
              {step === 1 && (
                <AppointmentTypeStep
                  draft={draft}
                  onChange={update}
                  onRetrySpecialties={() => setSpecialtiesToken((n) => n + 1)}
                  sites={sites}
                  specialties={specialties}
                  specialtiesStatus={specialtiesStatus}
                />
              )}
              {step === 2 && (
                <DateProfessionalStep availability={professionalsSearch} draft={draft} onChange={update} today={today} />
              )}
              {step === 3 && draft.date && (
                <TimeSlotStep
                  date={draft.date}
                  error={slotsSearch.error}
                  items={visibleSlots}
                  notice={notice}
                  onChangeDate={() => goTo(2)}
                  onRetry={slotsSearch.reload}
                  onSelect={(s) => update({ slot: s })}
                  selected={slot}
                  siteNames={siteNames}
                  status={slotsSearch.status}
                />
              )}
              {step === 4 && slot && <ConfirmationStep error={submitError} summary={summaryFor(slot)} />}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
