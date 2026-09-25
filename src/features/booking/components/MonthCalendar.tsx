import React, { useEffect, useRef, useState } from 'react';
import {
  addDays,
  buildMonthGrid,
  formatLongDate,
  formatMonthYear,
  parseIsoDate,
  shiftMonth,
  WEEKDAY_SHORT,
} from '../utils/dates';

interface Props {
  /** Hoy (`YYYY-MM-DD`): los días anteriores quedan deshabilitados. */
  today: string;
  value: string | null;
  onChange: (iso: string) => void;
}

const KEY_DELTAS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

/** Calendario mensual en línea, de lunes a domingo, sin días pasados. Flechas para moverse. */
export const MonthCalendar: React.FC<Props> = ({ today, value, onChange }) => {
  const initial = parseIsoDate(value ?? today);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [focusIso, setFocusIso] = useState<string>(value ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const todayDate = parseIsoDate(today);
  const atCurrentMonth = view.year === todayDate.getFullYear() && view.month === todayDate.getMonth();
  const weeks = buildMonthGrid(view.year, view.month);

  // El día con tabindex=0 debe estar en el mes visible.
  const visibleDays = weeks.flat().filter((d): d is string => d !== null && d >= today);
  const tabbable = visibleDays.includes(focusIso) ? focusIso : (visibleDays[0] ?? null);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus();
  }, [focusIso, view]);

  const goToMonth = (delta: number) => setView((v) => shiftMonth(v.year, v.month, delta));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, iso: string) => {
    const delta = KEY_DELTAS[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = addDays(iso, delta);
    if (next < today) return;
    const date = parseIsoDate(next);
    setView({ year: date.getFullYear(), month: date.getMonth() });
    moveFocus.current = true;
    setFocusIso(next);
  };

  return (
    <div className="border border-[#D9DDE3] rounded-xl p-4 bg-white flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[20px]">
            calendar_today
          </span>
          <span aria-live="polite" className="text-sm font-bold text-[#1C2430]" id="booking-calendar-month">
            {formatMonthYear(view.year, view.month)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Mes anterior"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#1C2430] hover:bg-[#F2F4F6] disabled:text-[#C2C8D0] disabled:cursor-not-allowed disabled:hover:bg-transparent focus-ring-custom"
            disabled={atCurrentMonth}
            onClick={() => goToMonth(-1)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              chevron_left
            </span>
          </button>
          <button
            aria-label="Mes siguiente"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#1C2430] hover:bg-[#F2F4F6] focus-ring-custom"
            onClick={() => goToMonth(1)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#5B6573]">
        {WEEKDAY_SHORT.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div ref={gridRef} aria-labelledby="booking-calendar-month" className="grid grid-cols-7 gap-1.5" role="group">
        {weeks.flat().map((iso, index) => {
          if (!iso) return <span key={`empty-${index}`} aria-hidden="true" />;
          const past = iso < today;
          const selected = iso === value;
          const isToday = iso === today;
          const day = parseIsoDate(iso).getDate();
          return (
            <button
              key={iso}
              aria-current={isToday ? 'date' : undefined}
              aria-label={formatLongDate(iso)}
              aria-pressed={selected}
              className={`relative h-11 rounded-lg flex items-center justify-center text-sm tabular-nums transition-colors duration-150 focus-ring-custom ${
                selected
                  ? 'bg-[#0F6E6E] text-white font-bold shadow-sm'
                  : past
                    ? 'text-[#C2C8D0] cursor-not-allowed'
                    : 'text-[#1C2430] font-medium hover:bg-[#F2F4F6]'
              }`}
              data-iso={iso}
              disabled={past}
              onClick={() => {
                setFocusIso(iso);
                onChange(iso);
              }}
              onKeyDown={(e) => handleKeyDown(e, iso)}
              tabIndex={iso === tabbable ? 0 : -1}
              type="button"
            >
              {day}
              {isToday && !selected && (
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-[#0F6E6E] absolute bottom-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
