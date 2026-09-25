import React, { useRef } from 'react';
import { Button } from '../../../shared/components/Button';
import { Site } from '../api/agendaApi';

export const ALL_SITES = 'ALL';

interface AgendaToolbarProps {
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  sites: Site[];
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  onPublish: () => void;
  publishDisabled: boolean;
}

const iconButton =
  'h-12 w-12 md:h-10 md:w-10 rounded-lg flex items-center justify-center text-[#1C2430] hover:bg-white focus-ring-custom transition-colors duration-150';

/** Segmentado de sede con semántica de radio: flechas para moverse, Tab entra al marcado. */
const SiteSegmented: React.FC<Pick<AgendaToolbarProps, 'sites' | 'siteFilter' | 'onSiteFilterChange'>> = ({
  sites,
  siteFilter,
  onSiteFilterChange,
}) => {
  const options = [{ value: ALL_SITES, label: 'Todas', title: 'Todas las sedes' }].concat(
    sites.map((s) => ({ value: s.code, label: s.code, title: s.name })),
  );
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onSiteFilterChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      aria-label="Filtrar por sede"
      className="inline-flex items-center gap-1 rounded-lg border border-[#D9DDE3] bg-[#F7F6F2] p-1"
      role="radiogroup"
    >
      {options.map((opt, index) => {
        const checked = siteFilter === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            aria-checked={checked}
            className={`min-h-[48px] md:min-h-[40px] px-4 rounded-md text-sm font-semibold transition-colors duration-150 focus-ring-custom ${
              checked ? 'bg-white text-[#0F6E6E] shadow-sm' : 'text-[#5B6573] hover:text-[#1C2430]'
            }`}
            onClick={() => onSiteFilterChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="radio"
            tabIndex={checked ? 0 : -1}
            title={opt.title}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export const AgendaToolbar: React.FC<AgendaToolbarProps> = ({
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
  sites,
  siteFilter,
  onSiteFilterChange,
  onPublish,
  publishDisabled,
}) => (
  <div className="bg-white border border-[#D9DDE3] rounded-xl shadow-[0_2px_8px_rgba(28,36,48,0.06)] p-4 flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 rounded-lg border border-[#D9DDE3] bg-[#F7F6F2] p-1">
        <button aria-label="Semana anterior" className={iconButton} onClick={onPrevWeek} type="button">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
            chevron_left
          </span>
        </button>
        <span aria-live="polite" className="px-2 min-w-[150px] text-center text-base font-semibold text-[#1C2430] tabular-nums whitespace-nowrap">
          {weekLabel}
        </span>
        <button aria-label="Semana siguiente" className={iconButton} onClick={onNextWeek} type="button">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
            chevron_right
          </span>
        </button>
      </div>
      <Button fullWidth={false} onClick={onToday} size="sm" type="button" variant="secondary" className="min-h-[48px] md:min-h-[40px] h-12 md:h-10">
        Hoy
      </Button>
    </div>
    <div className="lg:mx-auto">
      <SiteSegmented onSiteFilterChange={onSiteFilterChange} siteFilter={siteFilter} sites={sites} />
    </div>
    <Button className="lg:w-auto" disabled={publishDisabled} leadingIcon="add" onClick={onPublish} type="button">
      Publicar bloque
    </Button>
  </div>
);
