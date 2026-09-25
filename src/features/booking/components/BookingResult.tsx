import React from 'react';
import type { AppointmentStatus } from '../api/bookingApi';
import { AppointmentSummary, SummaryData } from './AppointmentSummary';
import { Button } from '../../../shared/components/Button';

interface Props {
  status: AppointmentStatus;
  summary: SummaryData;
  onDone: () => void;
}

/** Resultado de la reserva: confirmada (APPROVED) o solicitud enviada (REQUESTED). */
export const BookingResult: React.FC<Props> = ({ status, summary, onDone }) => {
  const approved = status === 'APPROVED';
  return (
    <div className="flex flex-col items-center text-center gap-6 px-5 sm:px-8 py-8">
      {approved ? (
        <span className="w-16 h-16 rounded-full bg-[#ECF7F1] flex items-center justify-center text-[#1E7B4F]">
          <span aria-hidden="true" className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </span>
      ) : (
        <span className="w-16 h-16 rounded-full bg-[#E6F2F1] flex items-center justify-center text-[#0F6E6E]">
          <span aria-hidden="true" className="material-symbols-outlined text-[36px]">
            schedule
          </span>
        </span>
      )}
      <div className="flex flex-col gap-2 max-w-md" role="status">
        <h3 className="text-2xl font-bold text-[#1C2430] outline-none" data-step-heading tabIndex={-1}>
          {approved ? '¡Tu cita está confirmada!' : 'Solicitud enviada'}
        </h3>
        {!approved && (
          <p className="text-sm text-[#5B6573]">Un administrador revisará tu solicitud. El horario queda apartado para ti.</p>
        )}
      </div>
      <div className="w-full max-w-lg">
        <AppointmentSummary data={summary} />
      </div>
      <div className="w-full max-w-lg">
        <Button onClick={onDone} type="button">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};
