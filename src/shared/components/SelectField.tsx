import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      id,
      label,
      options,
      helperText,
      errorText,
      isRequired = false,
      className = '',
      ...rest
    },
    ref
  ) => {
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = errorText ? `${id}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-[#1C2430]" htmlFor={id}>
          {label}
          {isRequired && (
            <span aria-hidden="true" className="text-[#B42318] ml-1">
              *
            </span>
          )}
        </label>

        <div className="relative w-full">
          <select
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={errorText ? 'true' : 'false'}
            className={`w-full min-h-[48px] h-12 appearance-none rounded-lg bg-white border px-4 pr-10 text-base text-[#1C2430] cursor-pointer transition-all duration-150 ${
              errorText
                ? 'bg-[#FEF3F2] border-[1.5px] border-[#B42318] text-[#1C2430] focus-ring-custom'
                : 'border-[#D9DDE3] focus-ring-custom'
            } ${className}`}
            id={id}
            required={isRequired}
            {...rest}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6573] pointer-events-none text-[20px] select-none"
          >
            arrow_drop_down
          </span>
        </div>

        {errorText && (
          <div
            aria-live="polite"
            className="flex items-center gap-1 text-[#B42318] mt-0.5"
            id={errorId}
            role="alert"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[15px] shrink-0">
              error
            </span>
            <span className="text-xs font-semibold">{errorText}</span>
          </div>
        )}

        {helperText && !errorText && (
          <span className="text-xs text-[#5B6573]" id={helperId}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
