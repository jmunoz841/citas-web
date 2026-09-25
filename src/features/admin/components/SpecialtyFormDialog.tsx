import React, { useId, useRef, useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { TextField } from '../../../shared/components/TextField';
import { ApiError } from '../../../shared/api/errors';
import { adminApi, DurationMinutes, Specialty } from '../api/adminApi';
import { ErrorMessage, toErrorMessage } from './AdminUi';

const DURATIONS: DurationMinutes[] = [30, 60];
const NAME_MAX = 120;

interface SpecialtyFormDialogProps {
  /** `null` = nueva especialidad. El padre monta el diálogo con `key` para reiniciar el estado. */
  specialty: Specialty | null;
  onClose: () => void;
  onSaved: (specialty: Specialty) => void;
}

/** Alta y edición de especialidad (HU-006): nombre y duración 30/60 min. */
export const SpecialtyFormDialog: React.FC<SpecialtyFormDialogProps> = ({ specialty, onClose, onSaved }) => {
  const [name, setName] = useState(specialty?.name ?? '');
  const [duration, setDuration] = useState<DurationMinutes>(specialty?.durationMinutes === 60 ? 60 : 30);
  const [errors, setErrors] = useState<{ name?: string; durationMinutes?: string }>({});
  const [banner, setBanner] = useState<ErrorMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const durationHelperId = useId();
  const durationErrorId = useId();
  const isEdit = specialty !== null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: 'El nombre de la especialidad es obligatorio' });
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    setErrors({});
    setBanner(null);
    try {
      const input = { name: trimmed, durationMinutes: duration };
      const saved = isEdit ? await adminApi.updateSpecialty(specialty.id, input) : await adminApi.createSpecialty(input);
      onSaved(saved);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === 'SPECIALTY_NAME_ALREADY_REGISTERED') {
        setErrors({ name: 'Ya existe una especialidad con ese nombre' });
        nameRef.current?.focus();
      } else if (err instanceof ApiError && (err.fieldErrors.name || err.fieldErrors.durationMinutes)) {
        setErrors({ name: err.fieldErrors.name, durationMinutes: err.fieldErrors.durationMinutes });
        if (err.fieldErrors.name) nameRef.current?.focus();
      } else {
        setBanner(toErrorMessage(err));
      }
    }
  };

  const formId = useId();

  return (
    <Modal
      busy={busy}
      footer={
        <>
          <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            form={formId}
            fullWidth={false}
            isLoading={busy}
            loadingText="Guardando…"
            type="submit"
          >
            {isEdit ? 'Guardar cambios' : 'Crear especialidad'}
          </Button>
        </>
      }
      icon="medical_services"
      maxWidth="480px"
      onClose={onClose}
      open
      title={isEdit ? 'Editar especialidad' : 'Nueva especialidad'}
    >
      <form className="flex flex-col gap-6" id={formId} noValidate onSubmit={handleSubmit}>
        {banner && <AlertBanner description={banner.description} title={banner.title} />}
        <TextField
          ref={nameRef}
          autoComplete="off"
          data-autofocus
          errorText={errors.name}
          id={`${formId}-name`}
          isRequired
          label="Nombre"
          maxLength={NAME_MAX}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          value={name}
        />

        <fieldset
          aria-describedby={[errors.durationMinutes ? durationErrorId : null, durationHelperId].filter(Boolean).join(' ')}
          className="p-0 m-0 border-0 flex flex-col gap-1.5"
        >
          <legend className="text-sm font-semibold text-[#1C2430] mb-1.5">
            Duración de la cita
            <span aria-hidden="true" className="text-[#B42318] ml-1">
              *
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#F7F6F2] border border-[#D9DDE3] p-1">
            {DURATIONS.map((value) => (
              <label key={value} className="relative">
                <input
                  checked={duration === value}
                  className="peer sr-only"
                  name={`${formId}-duration`}
                  onChange={() => setDuration(value)}
                  type="radio"
                  value={value}
                />
                <span className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold cursor-pointer select-none transition-colors duration-150 text-[#5B6573] hover:text-[#1C2430] peer-checked:bg-[#0F6E6E] peer-checked:text-white peer-checked:shadow-sm peer-focus-visible:shadow-[0_0_0_2px_#FFFFFF,0_0_0_5px_#2B8C8C]">
                  {duration === value && (
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                  )}
                  {value} min
                </span>
              </label>
            ))}
          </div>
          {errors.durationMinutes ? (
            <div className="flex items-center gap-1 text-[#B42318] mt-0.5" id={durationErrorId} role="alert">
              <span aria-hidden="true" className="material-symbols-outlined text-[15px] shrink-0">
                error
              </span>
              <span className="text-xs font-semibold">{errors.durationMinutes}</span>
            </div>
          ) : null}
          <span className="text-xs text-[#5B6573]" id={durationHelperId}>
            La agenda se organiza en bloques de 30 minutos
          </span>
        </fieldset>
      </form>
    </Modal>
  );
};
