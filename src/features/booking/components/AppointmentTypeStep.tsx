import React from 'react';
import type { Site, Specialty, SpecialtyType } from '../api/bookingApi';
import { ANY_SITE, BookingDraft } from '../utils/booking';
import { SelectField } from '../../../shared/components/SelectField';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Chip } from '../../../shared/components/Feedback';
import { StepHeading } from './StepHeading';

const FOCUS_WITHIN = 'has-[:focus-visible]:shadow-[0_0_0_2px_#FFFFFF,0_0_0_5px_#2B8C8C]';

interface Props {
  draft: BookingDraft;
  specialties: Specialty[];
  specialtiesStatus: 'loading' | 'ready' | 'error';
  onRetrySpecialties: () => void;
  sites: Site[];
  onChange: (patch: Partial<BookingDraft>) => void;
}

const TypeCard: React.FC<{
  value: SpecialtyType;
  checked: boolean;
  title: string;
  description: string;
  chip: React.ReactNode;
  onSelect: (value: SpecialtyType) => void;
}> = ({ value, checked, title, description, chip, onSelect }) => (
  <label
    className={`cursor-pointer rounded-xl p-4 flex flex-col justify-between gap-4 transition-colors duration-150 ${FOCUS_WITHIN} ${
      checked ? 'border-2 border-[#0F6E6E] bg-[#E6F2F1]' : 'border border-[#D9DDE3] bg-white hover:bg-[#F2F7F7]'
    }`}
  >
    <span className="flex items-start gap-3">
      <input
        checked={checked}
        className="sr-only"
        name="appointment-type"
        onChange={() => onSelect(value)}
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center shrink-0 ${
          checked ? 'border-[#0F6E6E]' : 'border-[#D9DDE3]'
        }`}
      >
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E6E]" />}
      </span>
      <span className="flex flex-col">
        <span className="text-base font-bold text-[#1C2430]">{title}</span>
        <span className="text-sm text-[#5B6573]">{description}</span>
      </span>
    </span>
    <span>{chip}</span>
  </label>
);

const SiteOption: React.FC<{ value: string; label: string; title?: string; checked: boolean; onSelect: (v: string) => void }> = ({
  value,
  label,
  title,
  checked,
  onSelect,
}) => (
  <label
    className={`cursor-pointer min-h-[48px] rounded-lg flex items-center justify-center gap-1.5 px-2 text-sm transition-colors duration-150 ${FOCUS_WITHIN} ${
      checked
        ? 'border-2 border-[#0F6E6E] bg-[#E6F2F1] text-[#0F6E6E] font-bold'
        : 'border border-[#D9DDE3] bg-white text-[#1C2430] font-medium hover:bg-[#F2F4F6]'
    }`}
    title={title}
  >
    <input
      checked={checked}
      className="sr-only"
      name="site"
      onChange={() => onSelect(value)}
      type="radio"
      value={value}
    />
    {checked && (
      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
        check
      </span>
    )}
    {label}
  </label>
);

/** Paso 1: tipo de cita, especialidad y sede preferida. */
export const AppointmentTypeStep: React.FC<Props> = ({
  draft,
  specialties,
  specialtiesStatus,
  onRetrySpecialties,
  sites,
  onChange,
}) => {
  const specialized = specialties.filter((s) => s.type === 'SPECIALIZED');

  const selectKind = (kind: SpecialtyType) =>
    onChange({ kind, specialtyId: kind === 'GENERAL' ? '' : draft.specialtyId, professionalId: '', slot: null });

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        subtitle="Elige el tipo de cita y la sede donde prefieres atenderte."
        title="Selecciona el tipo de cita"
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Tipo de cita</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TypeCard
            checked={draft.kind === 'GENERAL'}
            chip={
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F6E6E] bg-white px-2 py-1 rounded-md border border-[#D9DDE3]">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  bolt
                </span>
                Se confirma al instante
              </span>
            }
            description="30 min · Atención primaria"
            onSelect={selectKind}
            title="Medicina General"
            value="GENERAL"
          />
          <TypeCard
            checked={draft.kind === 'SPECIALIZED'}
            chip={
              <Chip icon="hourglass_top" tone="warning">
                Requiere aprobación
              </Chip>
            }
            description="Duración variable"
            onSelect={selectKind}
            title="Especialidad"
            value="SPECIALIZED"
          />
        </div>
      </fieldset>

      {draft.kind === 'SPECIALIZED' &&
        (specialtiesStatus === 'error' ? (
          <AlertBanner description="No pudimos cargar las especialidades. Inténtalo de nuevo." title="Especialidades no disponibles">
            <Button fullWidth={false} onClick={onRetrySpecialties} size="sm" type="button" variant="secondary">
              Reintentar
            </Button>
          </AlertBanner>
        ) : (
          <SelectField
            disabled={specialtiesStatus === 'loading'}
            id="booking-specialty"
            isRequired
            label="Especialidad"
            onChange={(e) => onChange({ specialtyId: e.target.value, professionalId: '', slot: null })}
            options={[
              { value: '', label: specialtiesStatus === 'loading' ? 'Cargando especialidades…' : 'Selecciona una especialidad' },
              ...specialized.map((s) => ({ value: String(s.id), label: `${s.name} · ${s.durationMinutes} min` })),
            ]}
            value={draft.specialtyId}
          />
        ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-[#1C2430] mb-2">
          Sede preferida
          <span aria-hidden="true" className="text-[#B42318] ml-1">
            *
          </span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {sites.map((site) => (
            <SiteOption
              key={site.code}
              checked={draft.siteChoice === site.code}
              label={site.code}
              onSelect={(v) => onChange({ siteChoice: v, professionalId: '', slot: null })}
              title={site.name}
              value={site.code}
            />
          ))}
          <SiteOption
            checked={draft.siteChoice === ANY_SITE}
            label="Cualquiera"
            onSelect={(v) => onChange({ siteChoice: v, professionalId: '', slot: null })}
            value={ANY_SITE}
          />
        </div>
      </fieldset>
    </div>
  );
};
