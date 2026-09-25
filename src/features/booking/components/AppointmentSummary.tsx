import React from 'react';
import type { Site } from '../api/bookingApi';
import { formatLongDateCapitalized, formatTimeRange } from '../utils/dates';

export interface SummaryData {
  specialtyName: string;
  durationMinutes: number;
  professionalName: string;
  site: Site | undefined;
  siteCode: string;
  date: string;
  startTime: string;
  endTime: string;
  general: boolean;
}

const Item: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[20px] shrink-0 mt-0.5">
      {icon}
    </span>
    <div className="min-w-0">
      <dt className="text-xs text-[#5B6573]">{label}</dt>
      <dd className="text-sm font-bold text-[#1C2430]">{children}</dd>
    </div>
  </div>
);

/** Resumen de la cita (paso 4 y resultados). */
export const AppointmentSummary: React.FC<{ data: SummaryData }> = ({ data }) => (
  <div className="bg-white border border-[#D9DDE3] rounded-xl p-5 shadow-[0_2px_8px_rgba(28,36,48,0.06)] flex flex-col gap-4 text-left w-full">
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#D9DDE3]">
      <span className="text-xs font-semibold text-[#5B6573] uppercase tracking-wider">Detalles de la cita</span>
      <span className="bg-[#E6F2F1] text-[#0F6E6E] text-xs px-2 py-0.5 rounded-md font-bold">
        {data.general ? 'Medicina General' : 'Especialidad'}
      </span>
    </div>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Item icon="stethoscope" label="Especialidad">
        {data.specialtyName} · {data.durationMinutes} min
      </Item>
      <Item icon="person" label="Profesional">
        {data.professionalName}
      </Item>
      <Item icon="calendar_month" label="Fecha">
        {formatLongDateCapitalized(data.date)}
      </Item>
      <Item icon="schedule" label="Hora">
        <span className="tabular-nums">{formatTimeRange(data.startTime, data.endTime)}</span>
      </Item>
      <div className="sm:col-span-2 pt-3 border-t border-[#D9DDE3]">
        <Item icon="location_on" label="Sede">
          {data.site ? `${data.site.code} — ${data.site.name}` : data.siteCode}
          {data.site && <span className="block text-xs font-normal text-[#5B6573] mt-0.5">{data.site.address}</span>}
        </Item>
      </div>
    </dl>
  </div>
);
