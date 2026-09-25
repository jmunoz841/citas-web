import React, { useRef, useState } from 'react';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { AvailabilityBlock, BlockInput, createBlock, Site, updateBlock } from '../api/agendaApi';
import { isPast, slotCount, timeOptions, toIsoDate } from '../utils/dates';

export const CONFLICT_MESSAGE = 'Este bloque tiene citas reservadas o solicitadas y no se puede modificar.';

type Field = 'date' | 'startTime' | 'endTime' | 'siteCode';
const FIELD_ORDER: Field[] = ['date', 'startTime', 'endTime', 'siteCode'];

interface BlockFormDialogProps {
  /** Bloque a editar; sin él, el diálogo publica uno nuevo. */
  block?: AvailabilityBlock;
  defaultDate: string;
  sites: Site[];
  onClose: () => void;
  onSaved: (block: AvailabilityBlock) => void;
  /** La API respondió que la cuenta profesional está inactiva. */
  onInactive: () => void;
}

const TIME_OPTIONS = timeOptions().map((t) => ({ value: t, label: t }));

/** Validación espejo de la API; el servidor sigue siendo la autoridad. */
function validate(input: BlockInput, now: Date): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!input.date) {
    errors.date = 'Fecha, hora de inicio y hora de fin son obligatorias';
  }
  if (slotCount(input.startTime, input.endTime) === 0) {
    errors.endTime = 'La hora de fin debe ser posterior a la de inicio';
  }
  if (input.date && isPast(input.date, input.startTime, now)) {
    errors.startTime = 'No se puede publicar disponibilidad en el pasado';
  }
  if (!input.siteCode) {
    errors.siteCode = 'Selecciona una sede';
  }
  return errors;
}

/** Diálogo "Publicar bloque" / "Editar bloque" (HU-010). Se monta al abrirse. */
export const BlockFormDialog: React.FC<BlockFormDialogProps> = ({ block, defaultDate, sites, onClose, onSaved, onInactive }) => {
  const editing = Boolean(block);
  const [values, setValues] = useState<BlockInput>(() => ({
    date: block?.date ?? defaultDate,
    startTime: block?.startTime ?? '08:00',
    endTime: block?.endTime ?? '12:00',
    siteCode: block?.siteCode ?? (sites.length === 1 ? sites[0].code : ''),
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [banner, setBanner] = useState<{ tone: 'error' | 'warning'; title: string; description: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const idPrefix = editing ? 'edit-block' : 'new-block';

  const slots = slotCount(values.startTime, values.endTime);

  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const focusFirstError = (found: Partial<Record<Field, string>>) => {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (!first) return;
    const id = first === 'siteCode' ? `${idPrefix}-site-${values.siteCode || sites[0]?.code}` : `${idPrefix}-${first}`;
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBanner(null);
    const local = validate(values, new Date());
    if (Object.keys(local).length > 0) {
      setErrors(local);
      focusFirstError(local);
      return;
    }
    setSubmitting(true);
    try {
      const saved = block ? await updateBlock(block.id, values) : await createBlock(values);
      onSaved(saved);
    } catch (err) {
      setSubmitting(false);
      const error = err instanceof ApiError ? err : null;
      if (error?.fieldErrors.professional) {
        onInactive();
        return;
      }
      if (error?.code === 'BLOCK_HAS_APPOINTMENTS') {
        setBanner({ tone: 'warning', title: 'No se puede modificar', description: CONFLICT_MESSAGE });
      } else if (error && Object.keys(error.fieldErrors).some((f) => FIELD_ORDER.includes(f as Field))) {
        const server: Partial<Record<Field, string>> = {};
        for (const f of FIELD_ORDER) {
          if (error.fieldErrors[f]) server[f] = error.fieldErrors[f];
        }
        setErrors(server);
        focusFirstError(server);
        return;
      } else if (!error || error.isConnectionProblem) {
        setBanner({ tone: 'error', title: 'Sin conexión', description: CONNECTION_ERROR_MESSAGE });
      } else {
        setBanner({ tone: 'error', title: 'No se pudo guardar', description: error.detail });
      }
      requestAnimationFrame(() => bannerRef.current?.focus());
    }
  };

  const formId = `${idPrefix}-form`;

  return (
    <Modal
      busy={submitting}
      footer={
        <>
          <Button className="sm:w-auto" disabled={submitting} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button className="sm:w-auto" form={formId} isLoading={submitting} loadingText="Guardando…" type="submit">
            {editing ? 'Guardar cambios' : 'Publicar bloque'}
          </Button>
        </>
      }
      icon={editing ? 'edit_calendar' : 'calendar_add_on'}
      onClose={onClose}
      open
      title={editing ? 'Editar bloque' : 'Publicar bloque'}
    >
      <form className="flex flex-col gap-6" id={formId} noValidate onSubmit={handleSubmit}>
        {banner && <AlertBanner ref={bannerRef} description={banner.description} title={banner.title} tone={banner.tone} />}

        <TextField
          data-autofocus
          errorText={errors.date}
          id={`${idPrefix}-date`}
          isRequired
          label="Fecha"
          min={toIsoDate(new Date())}
          onChange={set('date')}
          type="date"
          value={values.date}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
          <SelectField
            errorText={errors.startTime}
            id={`${idPrefix}-startTime`}
            isRequired
            label="Hora de inicio"
            onChange={set('startTime')}
            options={TIME_OPTIONS}
            value={values.startTime}
          />
          <SelectField
            errorText={errors.endTime}
            id={`${idPrefix}-endTime`}
            isRequired
            label="Hora de fin"
            onChange={set('endTime')}
            options={TIME_OPTIONS}
            value={values.endTime}
          />
        </div>

        <fieldset aria-describedby={errors.siteCode ? `${idPrefix}-site-error` : undefined} className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-[#1C2430] mb-1.5">
            Sede
            <span aria-hidden="true" className="text-[#B42318] ml-1">
              *
            </span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sites.map((site) => {
              const checked = values.siteCode === site.code;
              return (
                <label
                  key={site.code}
                  className={`min-h-[56px] rounded-lg border px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors duration-150 has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[#2B8C8C] has-[:focus-visible]:outline-offset-2 ${
                    checked ? 'border-[#0F6E6E] bg-[#E6F2F1]' : errors.siteCode ? 'border-[#B42318] bg-[#FEF3F2]' : 'border-[#D9DDE3] bg-white'
                  }`}
                  htmlFor={`${idPrefix}-site-${site.code}`}
                >
                  <input
                    checked={checked}
                    className="mt-1 accent-[#0F6E6E] h-4 w-4"
                    id={`${idPrefix}-site-${site.code}`}
                    name={`${idPrefix}-site`}
                    onChange={set('siteCode')}
                    type="radio"
                    value={site.code}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1C2430]">{site.code}</span>
                    <span className="text-xs text-[#5B6573]">{site.name}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.siteCode && (
            <div className="flex items-center gap-1 text-[#B42318] mt-0.5" id={`${idPrefix}-site-error`} role="alert">
              <span aria-hidden="true" className="material-symbols-outlined text-[15px] shrink-0">
                error
              </span>
              <span className="text-xs font-semibold">{errors.siteCode}</span>
            </div>
          )}
        </fieldset>

        <p aria-live="polite" className="flex items-center gap-2 text-sm text-[#0F6E6E] bg-[#E6F2F1] rounded-lg px-4 py-3">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            event_available
          </span>
          {slots === 1 ? 'Se creará 1 espacio de 30 minutos' : `Se crearán ${slots} espacios de 30 minutos`}
        </p>
      </form>
    </Modal>
  );
};
