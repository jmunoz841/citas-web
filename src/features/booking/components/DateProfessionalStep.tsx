import React from 'react';
import type { AvailabilitySlot } from '../api/bookingApi';
import type { AvailabilityStatus } from '../hooks/useAvailability';
import { BookingDraft, distinctProfessionals } from '../utils/booking';
import { SelectField } from '../../../shared/components/SelectField';
import { MonthCalendar } from './MonthCalendar';
import { StepHeading } from './StepHeading';

interface Props {
  draft: BookingDraft;
  today: string;
  /** Resultado de la búsqueda sin profesional: de ahí salen las opciones del selector. */
  availability: { status: AvailabilityStatus; items: AvailabilitySlot[] };
  onChange: (patch: Partial<BookingDraft>) => void;
}

/** Paso 2: fecha (sin días pasados) y profesional opcional. */
export const DateProfessionalStep: React.FC<Props> = ({ draft, today, availability, onChange }) => {
  const professionals = availability.status === 'ready' ? distinctProfessionals(availability.items) : [];

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        subtitle="Selecciona el día de tu consulta médica dentro de la disponibilidad activa."
        title="Fecha y profesional"
      />

      <MonthCalendar
        onChange={(date) => onChange({ date, professionalId: '', slot: null })}
        today={today}
        value={draft.date}
      />

      <SelectField
        disabled={!draft.date || availability.status === 'loading'}
        helperText={
          !draft.date
            ? 'Opcional. Elige primero una fecha.'
            : availability.status === 'loading'
              ? 'Opcional. Buscando profesionales…'
              : 'Opcional'
        }
        id="booking-professional"
        label="Profesional"
        onChange={(e) => onChange({ professionalId: e.target.value, slot: null })}
        options={[
          { value: '', label: 'Cualquier profesional' },
          ...professionals.map((p) => ({ value: String(p.id), label: p.name })),
        ]}
        value={draft.professionalId}
      />
    </div>
  );
};
