import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
  requiredBadge?: string;
  prefix?: string;
  isMonospace?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      label,
      helperText,
      errorText,
      isRequired = false,
      requiredBadge,
      prefix,
      isMonospace = false,
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
        <label
          className="text-sm font-semibold text-[#1C2430] flex items-center justify-between"
          htmlFor={id}
        >
          <span>
            {label}
            {isRequired && !requiredBadge && (
              <span aria-hidden="true" className="text-[#B42318] ml-1">
                *
              </span>
            )}
          </span>
          {requiredBadge && (
            <span className="text-xs font-normal text-[#5B6573]">{requiredBadge}</span>
          )}
        </label>

        <div className="relative flex items-center">
          {prefix && (
            <span
              aria-hidden="true"
              className="absolute left-3.5 text-sm text-[#5B6573] font-mono select-none"
            >
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={errorText ? 'true' : 'false'}
            className={`w-full min-h-[48px] h-12 rounded-lg bg-white border text-base text-[#1C2430] placeholder:text-[#8E9A9D] transition-all duration-150 ${
              prefix ? 'pl-12 pr-4' : 'px-4'
            } ${isMonospace ? 'font-mono tabular-nums' : ''} ${
              errorText
                ? 'bg-[#FEF3F2] border-[1.5px] border-[#B42318] text-[#1C2430] focus-ring-custom'
                : 'border-[#D9DDE3] focus-ring-custom'
            } ${className}`}
            id={id}
            required={isRequired}
            {...rest}
          />

          {errorText && !prefix && (
            <div
              aria-hidden="true"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B42318] pointer-events-none"
            >
              <span className="material-symbols-outlined text-[20px] block">error</span>
            </div>
          )}
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

TextField.displayName = 'TextField';
