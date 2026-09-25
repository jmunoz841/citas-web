import React from 'react';

interface FormGroupProps {
  icon: string;
  legend: string;
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  icon,
  legend,
  children,
  className = '',
}) => {
  return (
    <fieldset className={`p-0 m-0 border-0 ${className}`}>
      <legend className="text-xs uppercase tracking-[0.08em] text-[#5B6573] font-semibold mb-3 flex items-center gap-1.5 select-none">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[18px] text-[#0F6E6E]"
        >
          {icon}
        </span>
        <span>{legend}</span>
      </legend>
      {children}
    </fieldset>
  );
};
