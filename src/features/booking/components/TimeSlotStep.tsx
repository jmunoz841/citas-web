import React from 'react';
import type { AvailabilitySlot } from '../api/bookingApi';
import type { AvailabilityStatus } from '../hooks/useAvailability';
import { groupByProfessional, initials, slotKey, slotLabel } from '../utils/booking';
import { formatLongDateCapitalized } from '../utils/dates';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { EmptyState, SiteBadge } from '../../../shared/components/Feedback';

/** Aviso tras un intento fallido de reservar. */
export type SlotNotice = 'conflict' | 'past' | null;

interface Props {
  date: string;
  status: AvailabilityStatus;
  items: AvailabilitySlot[];
  error: string | null;
  selected: AvailabilitySlot | null;
  notice: SlotNotice;
  siteNames: Record<string, string>;
  onSelect: (slot: AvailabilitySlot) => void;
  onChangeDate: () => void;
  onRetry: () => void;
}

const SkeletonChips: React.FC = () => (
  <div aria-busy="true" className="flex flex-col gap-3" role="status">
    <span className="sr-only">Cargando horarios…</span>
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-[#EEF0F2] animate-pulse" />
      <span className="h-3 w-40 rounded bg-[#EEF0F2] animate-pulse" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="h-12 rounded-lg bg-[#EEF0F2] animate-pulse" />
      ))}
    </div>
  </div>
);

/** Paso 3: horarios agrupados por profesional. */
export const TimeSlotStep: React.FC<Props> = ({
  date,
  status,
  items,
  error,
  selected,
  notice,
  siteNames,
  onSelect,
  onChangeDate,
  onRetry,
}) => {
  const groups = groupByProfessional(items);
  const selectedKey = selected ? slotKey(selected) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 border-b border-[#D9DDE3] pb-3">
        <div>
          <span className="text-xs text-[#0F6E6E] font-bold uppercase tracking-wider">Fecha elegida</span>
          <h3 className="text-lg sm:text-xl font-bold text-[#1C2430] outline-none" data-step-heading tabIndex={-1}>
            {formatLongDateCapitalized(date)}
          </h3>
        </div>
        <button
          className="min-h-[40px] px-2 rounded-lg text-sm font-semibold text-[#0F6E6E] hover:underline flex items-center gap-1 focus-ring-custom shrink-0"
          onClick={onChangeDate}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
            edit_calendar
          </span>
          Cambiar
        </button>
      </div>

      {notice === 'conflict' && (
        <AlertBanner
          description="Ese horario acaba de ser reservado por otra persona. Elige otro."
          title="Conflicto en la reserva"
          tone="warning"
        />
      )}
      {notice === 'past' && (
        <AlertBanner description="Ese horario ya pasó. Elige otro." title="Horario no disponible" />
      )}

      {status === 'loading' && <SkeletonChips />}

      {status === 'error' && (
        <AlertBanner description={error ?? ''} title="No pudimos cargar los horarios">
          <Button fullWidth={false} onClick={onRetry} size="sm" type="button" variant="secondary">
            Reintentar
          </Button>
        </AlertBanner>
      )}

      {status === 'ready' && groups.length === 0 && (
        <div className="border border-dashed border-[#D9DDE3] rounded-xl">
          <EmptyState
            action={
              <Button fullWidth={false} leadingIcon="edit_calendar" onClick={onChangeDate} type="button" variant="secondary">
                Cambiar fecha
              </Button>
            }
            description="Prueba otra fecha u otra sede."
            icon="schedule"
            title="No hay horarios disponibles para este día."
          />
        </div>
      )}

      {status === 'ready' &&
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`group-${group.key}`} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-[#E6F2F1] flex items-center justify-center font-bold text-[#0F6E6E] text-xs shrink-0"
                >
                  {initials(group.professionalName)}
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-[#1C2430] block truncate" id={`group-${group.key}`}>
                    {group.professionalName}
                  </span>
                  <span className="text-xs text-[#5B6573]">{group.specialtyName}</span>
                </div>
              </div>
              <SiteBadge code={group.siteCode} title={siteNames[group.siteCode]} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.slots.map((slot) => {
                const key = slotKey(slot);
                const isSelected = key === selectedKey;
                return (
                  <button
                    key={key}
                    aria-pressed={isSelected}
                    className={`min-h-[48px] px-3 rounded-lg text-sm tabular-nums flex items-center justify-center gap-1.5 transition-colors duration-150 focus-ring-custom ${
                      isSelected
                        ? 'bg-[#0F6E6E] border border-[#0F6E6E] text-white font-bold shadow-sm'
                        : 'bg-white border border-[#D9DDE3] text-[#1C2430] font-medium hover:bg-[#F2F4F6]'
                    }`}
                    onClick={() => onSelect(slot)}
                    type="button"
                  >
                    {isSelected && (
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    )}
                    {slotLabel(slot)}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
};
