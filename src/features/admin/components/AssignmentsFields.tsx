import React, { useId } from 'react';
import { FormGroup } from '../../../shared/components/FormGroup';
import { Site } from '../../catalogs/api/catalogsApi';
import { Specialty, SpecialtyAssignment } from '../api/adminApi';

/** Asignaciones en edición: especialidades marcadas, cuál es la principal y sedes. */
export interface AssignmentsValue {
  specialtyIds: number[];
  primaryId: number | null;
  siteCodes: string[];
}

export interface AssignmentsErrors {
  specialties?: string;
  siteCodes?: string;
}

export const PRIMARY_REQUIRED = 'Marca exactamente una especialidad principal';
export const SITE_REQUIRED = 'Asigna al menos una sede';

export function assignmentsFrom(specialties: SpecialtyAssignment[], siteCodes: string[]): AssignmentsValue {
  return {
    specialtyIds: specialties.map((s) => s.specialtyId),
    primaryId: specialties.find((s) => s.primary)?.specialtyId ?? null,
    siteCodes: [...siteCodes],
  };
}

export function toSpecialtyAssignments(value: AssignmentsValue): SpecialtyAssignment[] {
  return value.specialtyIds.map((specialtyId) => ({ specialtyId, primary: specialtyId === value.primaryId }));
}

/** Espejo de las reglas del backend: al menos una especialidad, exactamente una principal y al menos una sede. */
export function validateAssignments(value: AssignmentsValue): AssignmentsErrors {
  const errors: AssignmentsErrors = {};
  if (value.specialtyIds.length === 0 || value.primaryId === null || !value.specialtyIds.includes(value.primaryId)) {
    errors.specialties = PRIMARY_REQUIRED;
  }
  if (value.siteCodes.length === 0) {
    errors.siteCodes = SITE_REQUIRED;
  }
  return errors;
}

const FieldError: React.FC<{ id: string; message: string }> = ({ id, message }) => (
  <div className="flex items-center gap-1 text-[#B42318] mt-1" id={id} role="alert">
    <span aria-hidden="true" className="material-symbols-outlined text-[15px] shrink-0">
      error
    </span>
    <span className="text-xs font-semibold">{message}</span>
  </div>
);

interface AssignmentsFieldsProps {
  /** Especialidades que se pueden marcar: las activas y las que ya tiene asignadas. */
  specialties: Specialty[];
  sites: Site[];
  value: AssignmentsValue;
  onChange: (value: AssignmentsValue) => void;
  errors: AssignmentsErrors;
  /** Ids de los grupos, para el resumen de errores y el foco. */
  specialtiesGroupId: string;
  sitesGroupId: string;
}

/** Grupo ASIGNACIONES: especialidades con un radio "Principal" por fila y tarjetas de sede. */
export const AssignmentsFields: React.FC<AssignmentsFieldsProps> = ({
  specialties,
  sites,
  value,
  onChange,
  errors,
  specialtiesGroupId,
  sitesGroupId,
}) => {
  const baseId = useId();
  const specialtiesHelpId = `${baseId}-sp-help`;
  const specialtiesErrorId = `${baseId}-sp-error`;
  const sitesErrorId = `${baseId}-site-error`;

  const toggleSpecialty = (id: number, checked: boolean) => {
    const specialtyIds = checked ? [...value.specialtyIds, id] : value.specialtyIds.filter((s) => s !== id);
    const primaryId = !checked && value.primaryId === id ? null : value.primaryId;
    onChange({ ...value, specialtyIds, primaryId });
  };

  const toggleSite = (code: string, checked: boolean) => {
    const siteCodes = checked ? [...value.siteCodes, code] : value.siteCodes.filter((s) => s !== code);
    onChange({ ...value, siteCodes });
  };

  return (
    <FormGroup icon="domain_add" legend="Asignaciones">
      <div className="flex flex-col gap-6">
        <fieldset
          aria-describedby={[errors.specialties ? specialtiesErrorId : null, specialtiesHelpId].filter(Boolean).join(' ')}
          className="p-0 m-0 border-0 flex flex-col gap-2 rounded-lg focus-ring-custom"
          id={specialtiesGroupId}
          tabIndex={-1}
        >
          <legend className="text-sm font-semibold text-[#1C2430]">
            Especialidades
            <span aria-hidden="true" className="text-[#B42318] ml-1">
              *
            </span>
          </legend>
          <span className="text-xs text-[#5B6573] -mt-1" id={specialtiesHelpId}>
            Marca exactamente una como principal
          </span>
          <ul
            className={`rounded-lg border divide-y divide-[#D9DDE3] ${
              errors.specialties ? 'border-[1.5px] border-[#B42318]' : 'border-[#D9DDE3]'
            }`}
          >
            {specialties.map((specialty) => {
              const checked = value.specialtyIds.includes(specialty.id);
              const checkboxId = `${baseId}-sp-${specialty.id}`;
              return (
                <li key={specialty.id} className="flex items-center justify-between gap-3 px-3 min-h-[52px]">
                  <label className="flex items-center gap-3 min-h-[48px] flex-1 cursor-pointer text-sm text-[#1C2430]" htmlFor={checkboxId}>
                    <input
                      checked={checked}
                      className="h-5 w-5 accent-[#0F6E6E] focus-ring-custom rounded"
                      id={checkboxId}
                      onChange={(e) => toggleSpecialty(specialty.id, e.target.checked)}
                      type="checkbox"
                    />
                    <span className="font-medium">{specialty.name}</span>
                    {!specialty.active && <span className="text-xs text-[#5B6573]">(inactiva)</span>}
                  </label>
                  <label
                    className={`flex items-center gap-1.5 min-h-[48px] text-sm whitespace-nowrap ${
                      checked ? 'cursor-pointer text-[#1C2430]' : 'cursor-not-allowed text-[#5B6573] opacity-60'
                    }`}
                  >
                    <input
                      aria-label={`Principal (${specialty.name})`}
                      checked={checked && value.primaryId === specialty.id}
                      className="h-4 w-4 accent-[#0F6E6E] focus-ring-custom"
                      disabled={!checked}
                      name={`${baseId}-primary`}
                      onChange={() => onChange({ ...value, primaryId: specialty.id })}
                      type="radio"
                    />
                    {value.primaryId === specialty.id && checked && (
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[#0F6E6E]">
                        star
                      </span>
                    )}
                    Principal
                  </label>
                </li>
              );
            })}
          </ul>
          {errors.specialties && <FieldError id={specialtiesErrorId} message={errors.specialties} />}
        </fieldset>

        <fieldset
          aria-describedby={errors.siteCodes ? sitesErrorId : undefined}
          className="p-0 m-0 border-0 flex flex-col gap-2 rounded-lg focus-ring-custom"
          id={sitesGroupId}
          tabIndex={-1}
        >
          <legend className="text-sm font-semibold text-[#1C2430] mb-2">
            Sedes de atención
            <span aria-hidden="true" className="text-[#B42318] ml-1">
              *
            </span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sites.map((site) => {
              const checked = value.siteCodes.includes(site.code);
              return (
                <label
                  key={site.code}
                  className={`flex items-start gap-3 rounded-lg border p-3 min-h-[48px] cursor-pointer transition-colors duration-150 ${
                    checked ? 'border-[#0F6E6E] bg-[#E6F2F1]' : errors.siteCodes ? 'border-[1.5px] border-[#B42318]' : 'border-[#D9DDE3] bg-white'
                  }`}
                >
                  <input
                    checked={checked}
                    className="h-5 w-5 mt-0.5 accent-[#0F6E6E] focus-ring-custom rounded shrink-0"
                    onChange={(e) => toggleSite(site.code, e.target.checked)}
                    type="checkbox"
                  />
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-[#1C2430]">
                      {site.code} · {site.name}
                    </span>
                    <span className="text-xs text-[#5B6573]">{site.address}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.siteCodes && <FieldError id={sitesErrorId} message={errors.siteCodes} />}
        </fieldset>
      </div>
    </FormGroup>
  );
};
