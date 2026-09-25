import React from 'react';
import { AvailabilityBlock } from '../api/agendaApi';
import { blockAccessibleName, blockRange } from '../utils/blocks';
import { formatLongDay, formatShortDay, toIsoDate, weekdayName } from '../utils/dates';

interface DayViewProps {
  days: Date[];
  today: string;
  selectedDay: string;
  onSelectDay: (iso: string) => void;
  blocks: AvailabilityBlock[];
  onSelectBlock: (block: AvailabilityBlock, trigger: HTMLElement) => void;
}

/** Móvil: selector de día y los bloques de ese día como tarjetas a ancho completo. */
export const DayView: React.FC<DayViewProps> = ({ days, today, selectedDay, onSelectDay, blocks, onSelectBlock }) => {
  const selected = days.find((d) => toIsoDate(d) === selectedDay) ?? days[0];
  const dayBlocks = blocks.filter((b) => b.date === toIsoDate(selected));

  return (
    <div className="flex flex-col gap-4">
      <div aria-label="Día" className="grid grid-cols-6 gap-1" role="group">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const isSelected = iso === toIsoDate(selected);
          const isToday = iso === today;
          return (
            <button
              key={iso}
              aria-current={isToday ? 'date' : undefined}
              aria-label={formatLongDay(day) + (isToday ? ' (hoy)' : '')}
              aria-pressed={isSelected}
              className={`min-h-[56px] rounded-lg border flex flex-col items-center justify-center text-xs focus-ring-custom transition-colors duration-150 ${
                isSelected
                  ? 'bg-[#0F6E6E] border-[#0F6E6E] text-white'
                  : `bg-white border-[#D9DDE3] ${isToday ? 'text-[#0F6E6E]' : 'text-[#1C2430]'}`
              }`}
              onClick={() => onSelectDay(iso)}
              type="button"
            >
              <span className="font-semibold uppercase">{weekdayName(day).slice(0, 3)}</span>
              <span className="tabular-nums">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <section aria-label={formatLongDay(selected)} className="bg-white border border-[#D9DDE3] rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[#1C2430]">
          {weekdayName(selected)} {formatShortDay(selected)}
        </h2>
        {dayBlocks.length === 0 ? (
          <p className="text-sm text-[#8E9A9D] py-4 text-center">Sin horarios</p>
        ) : (
          dayBlocks.map((block) => (
            <button
              key={block.id}
              aria-label={blockAccessibleName(block)}
              className="w-full min-h-[64px] text-left rounded-lg bg-[#E6F2F1] border border-[#0F6E6E]/40 px-4 py-3 flex items-center justify-between gap-3 focus-ring-custom"
              onClick={(e) => onSelectBlock(block, e.currentTarget)}
              type="button"
            >
              <span className="flex flex-col gap-1">
                <span className="text-base font-semibold text-[#0F6E6E] tabular-nums">{blockRange(block)}</span>
                <span className="flex items-center gap-1 text-sm text-[#1C2430]">
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[#0F6E6E]">
                    event_available
                  </span>
                  {block.slots} espacios (30m)
                </span>
              </span>
              <span className="shrink-0 rounded bg-white text-[#0F6E6E] text-xs font-semibold tracking-wide px-2 py-1">
                {block.siteCode}
              </span>
            </button>
          ))
        )}
      </section>
    </div>
  );
};
