import React from 'react';
import { STEP_NAMES } from '../utils/booking';

/** Indicador de 4 pasos. `current` va de 1 a 4. */
export const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  const total = STEP_NAMES.length;
  const currentName = STEP_NAMES[current - 1];

  return (
    <div className="px-5 sm:px-6 py-3 sm:py-4 bg-[#FAFBFB] border-b border-[#D9DDE3]">
      <p aria-live="polite" className="sr-only">
        {`Paso ${current} de ${total}, ${currentName}`}
      </p>

      {/* Móvil: texto compacto */}
      <div aria-hidden="true" className="flex items-center gap-2 sm:hidden">
        <span className="w-7 h-7 rounded-full bg-[#0F6E6E] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {current}
        </span>
        <span className="text-sm text-[#5B6573]">
          Paso {current} de {total}
        </span>
        <span className="text-sm font-semibold text-[#0F6E6E]">· {currentName}</span>
      </div>

      <ol aria-label="Pasos para agendar la cita" className="hidden sm:grid grid-cols-4 items-center gap-2">
        {STEP_NAMES.map((name, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={name} aria-current={active ? 'step' : undefined} className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden="true"
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  active
                    ? 'bg-[#0F6E6E] text-white font-bold'
                    : done
                      ? 'bg-[#E6F2F1] text-[#0F6E6E] font-bold'
                      : 'bg-[#ECEEEF] text-[#5B6573] font-semibold'
                }`}
              >
                {done ? <span className="material-symbols-outlined text-[16px]">check</span> : step}
              </span>
              <span
                className={`text-xs truncate ${
                  active ? 'font-bold text-[#0F6E6E]' : done ? 'font-semibold text-[#1C2430]' : 'font-medium text-[#5B6573]'
                }`}
              >
                {name}
                {done && <span className="sr-only"> (completado)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
