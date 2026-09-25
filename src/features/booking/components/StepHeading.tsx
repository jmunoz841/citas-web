import React from 'react';

/** Título de cada paso. Recibe el foco al cambiar de paso (`data-step-heading`). */
export const StepHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col gap-1">
    <h3 className="text-lg font-bold text-[#1C2430] outline-none" data-step-heading tabIndex={-1}>
      {title}
    </h3>
    {subtitle && <p className="text-sm text-[#5B6573]">{subtitle}</p>}
  </div>
);
