import React, { useId, useRef, useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { ApiError } from '../../../shared/api/errors';
import { Site } from '../../catalogs/api/catalogsApi';
import { adminApi, Professional, Specialty } from '../api/adminApi';
import { ErrorMessage, toErrorMessage } from './AdminUi';
import {
  AssignmentsErrors,
  AssignmentsFields,
  assignmentsFrom,
  AssignmentsValue,
  toSpecialtyAssignments,
  validateAssignments,
} from './AssignmentsFields';
import { Drawer } from './Drawer';

function sameSet<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

interface AssignmentsDrawerProps {
  professional: Professional;
  /** Todas las especialidades (admin): se ofrecen las activas y las que ya tiene asignadas. */
  specialties: Specialty[];
  sites: Site[];
  onClose: () => void;
  /** Profesional actualizado por la API, también tras un guardado parcial (el cajón sigue abierto). */
  onUpdated: (professional: Professional) => void;
}

/**
 * "Editar asignaciones" (HU-008): reemplaza especialidades y sedes. Solo llama al endpoint de lo
 * que cambió (`PUT /specialties`, `PUT /sites`).
 */
export const AssignmentsDrawer: React.FC<AssignmentsDrawerProps> = ({
  professional,
  specialties,
  sites,
  onClose,
  onUpdated,
}) => {
  const initial = assignmentsFrom(professional.specialties, professional.siteCodes);
  const [value, setValue] = useState<AssignmentsValue>(initial);
  const [errors, setErrors] = useState<AssignmentsErrors>({});
  const [banner, setBanner] = useState<ErrorMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const specialtiesGroupId = `${baseId}-specialties`;
  const sitesGroupId = `${baseId}-sites`;

  const assignedIds = professional.specialties.map((s) => s.specialtyId);
  const options = specialties.filter((s) => s.active || assignedIds.includes(s.id));

  const handleChange = (next: AssignmentsValue) => {
    setValue(next);
    if (errors.specialties || errors.siteCodes) {
      const still = validateAssignments(next);
      setErrors({
        specialties: errors.specialties && still.specialties ? errors.specialties : undefined,
        siteCodes: errors.siteCodes && still.siteCodes ? errors.siteCodes : undefined,
      });
    }
  };

  const handleSave = async () => {
    setBanner(null);
    const local = validateAssignments(value);
    setErrors(local);
    if (local.specialties || local.siteCodes) {
      document.getElementById(local.specialties ? specialtiesGroupId : sitesGroupId)?.focus();
      return;
    }

    const specialtiesChanged =
      value.primaryId !== initial.primaryId || !sameSet(value.specialtyIds, initial.specialtyIds);
    const sitesChanged = !sameSet(value.siteCodes, initial.siteCodes);
    if (!specialtiesChanged && !sitesChanged) {
      onClose();
      return;
    }

    setBusy(true);
    let latest: Professional | null = null;
    try {
      if (specialtiesChanged) {
        latest = await adminApi.assignSpecialties(professional.id, toSpecialtyAssignments(value));
      }
      if (sitesChanged) {
        latest = await adminApi.assignSites(professional.id, value.siteCodes);
      }
      if (latest) onUpdated(latest);
      onClose();
    } catch (err) {
      // Un guardado parcial (especialidades sí, sedes no) también se refleja en la tabla.
      if (latest) onUpdated(latest);
      setBusy(false);
      const fieldErrors = err instanceof ApiError ? err.fieldErrors : {};
      const specialtiesError = Object.entries(fieldErrors).find(([f]) => f.startsWith('specialties'))?.[1];
      const sitesError = Object.entries(fieldErrors).find(([f]) => f.startsWith('siteCodes'))?.[1];
      if (specialtiesError || sitesError) {
        setErrors({ specialties: specialtiesError, siteCodes: sitesError });
      } else {
        setBanner(toErrorMessage(err));
        setTimeout(() => bannerRef.current?.focus(), 0);
      }
    }
  };

  const fullName = `${professional.firstNames} ${professional.lastNames}`;

  return (
    <Drawer
      busy={busy}
      footer={
        <>
          <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            fullWidth={false}
            isLoading={busy}
            leadingIcon="check"
            loadingText="Guardando…"
            onClick={handleSave}
            type="button"
          >
            Guardar cambios
          </Button>
        </>
      }
      icon="assignment_ind"
      onClose={onClose}
      subtitle={`${fullName} · ${professional.professionalCode}`}
      title="Editar asignaciones"
    >
      <div className="flex flex-col gap-5">
        {banner && <AlertBanner ref={bannerRef} description={banner.description} title={banner.title} />}
        <AssignmentsFields
          errors={errors}
          onChange={handleChange}
          sites={sites}
          sitesGroupId={sitesGroupId}
          specialties={options}
          specialtiesGroupId={specialtiesGroupId}
          value={value}
        />
      </div>
    </Drawer>
  );
};
