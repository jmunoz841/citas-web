import React, { useState } from 'react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
  rightLink?: React.ReactNode;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id,
      label,
      helperText,
      errorText,
      isRequired = false,
      rightLink,
      className = '',
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = errorText ? `${id}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const toggleLabel = showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';

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

        <div className="relative flex items-center">
          <input
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={errorText ? 'true' : 'false'}
            className={`w-full min-h-[48px] h-12 pl-4 pr-12 rounded-lg bg-white border text-base text-[#1C2430] placeholder:text-[#8E9A9D] transition-all duration-150 ${
              errorText
                ? 'bg-[#FEF3F2] border-[1.5px] border-[#B42318] text-[#1C2430] focus-ring-custom'
                : 'border-[#D9DDE3] focus-ring-custom'
            } ${className}`}
            id={id}
            required={isRequired}
            type={showPassword ? 'text' : 'password'}
            {...rest}
          />

          <button
            aria-label={toggleLabel}
            className="absolute right-1.5 w-10 h-10 flex items-center justify-center rounded-lg text-[#5B6573] hover:text-[#1C2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8C8C] transition-colors cursor-pointer"
            onClick={() => setShowPassword((prev) => !prev)}
            title={toggleLabel}
            type="button"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[20px] block select-none"
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>

        {rightLink && <div className="flex justify-end pt-0.5">{rightLink}</div>}

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

PasswordField.displayName = 'PasswordField';
