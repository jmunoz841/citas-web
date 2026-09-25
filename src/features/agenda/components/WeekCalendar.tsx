import React from 'react';
import { AvailabilityBlock } from '../api/agendaApi';
import { blockAccessibleName, blockRange } from '../utils/blocks';
import { formatLongDay, formatShortDay, minutesToTime, timeToMinutes, toIsoDate, weekdayName } from '../utils/dates';

/** Alto en px de una fila de 30 minutos. */
const ROW_PX = 32;
const DEFAULT_START = 7 * 60;
const DEFAULT_END = 19 * 60;

interface WeekCalendarProps {
  days: Date[];
  today: string;
  blocks: AvailabilityBlock[];
  onSelectBlock: (block: AvailabilityBlock, trigger: HTMLElement) => void;
}

/** Eje 07:00–19:00; se amplía si algún bloque visible queda fuera. */
function axisRange(blocks: AvailabilityBlock[]): [number, number] {
  let start = DEFAULT_START;
  let end = DEFAULT_END;
  for (const b of blocks) {
    start = Math.min(start, Math.floor(timeToMinutes(b.startTime) / 60) * 60);
    end = Math.max(end, Math.ceil(timeToMinutes(b.endTime) / 60) * 60);
  }
  return [start, end];
}

export const BlockTile: React.FC<{
  block: AvailabilityBlock;
  onSelect: WeekCalendarProps['onSelectBlock'];
  style?: React.CSSProperties;
  className?: string;
  compact?: boolean;
}> = ({ block, onSelect, style, className = '', compact = false }) => (
  <button
    aria-label={blockAccessibleName(block)}
    className={`text-left rounded-lg bg-[#E6F2F1] border border-[#0F6E6E]/40 hover:border-[#0F6E6E] px-2.5 py-1.5 flex flex-col justify-between gap-1 overflow-hidden transition-colors duration-150 focus-ring-custom ${className}`}
    onClick={(e) => onSelect(block, e.currentTarget)}
    style={style}
    type="button"
  >
    <span className="flex items-start justify-between gap-2 w-full">
      <span className="text-sm font-semibold text-[#0F6E6E] tabular-nums leading-tight">{blockRange(block)}</span>
      <span className="shrink-0 rounded bg-white text-[#0F6E6E] text-[11px] font-semibold tracking-wide px-1.5 py-0.5">
        {block.siteCode}
      </span>
    </span>
    {!compact && (
      <span className="flex items-center gap-1 text-xs text-[#1C2430]">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[#0F6E6E]">
          event_available
        </span>
        {block.slots} espacios (30m)
      </span>
    )}
  </button>
);

/** Calendario semanal de lunes a sábado (tablet y escritorio). En tablet se desplaza en horizontal. */
export const WeekCalendar: React.FC<WeekCalendarProps> = ({ days, today, blocks, onSelectBlock }) => {
  const [axisStart, axisEnd] = axisRange(blocks);
  const rows = (axisEnd - axisStart) / 30;
  const height = rows * ROW_PX;
  const hours = Array.from({ length: (axisEnd - axisStart) / 60 + 1 }, (_, i) => axisStart + i * 60);
  const columns = '64px repeat(6, minmax(120px, 1fr))';

  return (
    <div className="bg-white border border-[#D9DDE3] rounded-xl shadow-[0_2px_8px_rgba(28,36,48,0.06)] overflow-x-auto">
      <div className="min-w-[784px]">
        <div className="grid border-b border-[#D9DDE3] bg-[#F7F6F2]" style={{ gridTemplateColumns: columns }}>
          <div className="px-3 py-3 text-xs font-semibold text-[#5B6573] self-end">Hora</div>
          {days.map((day) => {
            const isToday = toIsoDate(day) === today;
            return (
              <div
                key={toIsoDate(day)}
                aria-current={isToday ? 'date' : undefined}
                className={`px-2 py-3 text-center ${isToday ? 'text-[#0F6E6E]' : 'text-[#1C2430]'}`}
                data-testid={isToday ? 'today-header' : undefined}
              >
                <span className={`block text-xs uppercase tracking-[0.08em] font-semibold ${isToday ? '' : 'text-[#5B6573]'}`}>
                  {weekdayName(day)}
                </span>
                <span className={`block text-xl tabular-nums ${isToday ? 'font-bold' : 'font-medium'}`}>{formatShortDay(day)}</span>
                {isToday && <span className="sr-only">(hoy)</span>}
              </div>
            );
          })}
        </div>
        <div className="grid relative" style={{ gridTemplateColumns: columns, height: height + ROW_PX }}>
          <div aria-hidden="true" className="relative bg-[#F7F6F2] border-r border-[#D9DDE3]">
            {hours.map((m) => (
              <span
                key={m}
                className="absolute right-2 -translate-y-1/2 text-xs text-[#5B6573] tabular-nums"
                style={{ top: ((m - axisStart) / 30) * ROW_PX + ROW_PX / 2 }}
              >
                {minutesToTime(m)}
              </span>
            ))}
          </div>
          {days.map((day) => {
            const iso = toIsoDate(day);
            const dayBlocks = blocks.filter((b) => b.date === iso);
            return (
              <div
                key={iso}
                aria-label={formatLongDay(day)}
                className="relative border-r border-[#D9DDE3] last:border-r-0"
                role="group"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW_PX - 1}px, #EEF0F2 ${ROW_PX - 1}px, #EEF0F2 ${ROW_PX}px)`,
                  backgroundPositionY: ROW_PX / 2,
                }}
              >
                {dayBlocks.length === 0 && (
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-[#8E9A9D]">Sin horarios</span>
                )}
                {dayBlocks.map((block) => {
                  const top = ((timeToMinutes(block.startTime) - axisStart) / 30) * ROW_PX + ROW_PX / 2;
                  const blockHeight = Math.max(block.slots, 1) * ROW_PX;
                  return (
                    <BlockTile
                      key={block.id}
                      block={block}
                      className="absolute left-1.5 right-1.5"
                      compact={block.slots < 2}
                      onSelect={onSelectBlock}
                      style={{ top: top + 1, height: blockHeight - 2 }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
