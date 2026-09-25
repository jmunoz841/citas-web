import React from 'react';
import { AppointmentSummary, SummaryData } from './AppointmentSummary';
import { StepHeading } from './StepHeading';
import { AlertBanner } from '../../../shared/components/AlertBanner';

interface Props {
  summary: SummaryData;
  error: string | null;
}

/** Paso 4: resumen y nota según el tipo de cita. */
export const ConfirmationStep: React.FC<Props> = ({ summary, error }) => (
  <div className="flex flex-col gap-6">
    <StepHeading title="Revisa los datos de tu cita" />

    {error && <AlertBanner description={error} title="No pudimos reservar tu cita" />}

    <AppointmentSummary data={summary} />

    {summary.general ? (
      <div className="p-4 rounded-lg bg-[#E6F2F1] border border-[#0F6E6E]/30 flex items-start gap-3">
        <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[20px] shrink-0">
          check_circle
        </span>
        <p className="text-sm text-[#1C2430]">Tu cita quedará confirmada de inmediato.</p>
      </div>
    ) : (
      <div className="p-4 rounded-lg bg-[#FFF8ED] border border-[#A15C00]/40 flex items-start gap-3">
        <span aria-hidden="true" className="material-symbols-outlined text-[#A15C00] text-[20px] shrink-0">
          hourglass_top
        </span>
        <p className="text-sm text-[#1C2430]">
          Enviaremos tu solicitud al administrador. El horario queda apartado mientras la revisa.
        </p>
      </div>
    )}
  </div>
);
