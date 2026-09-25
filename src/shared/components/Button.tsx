import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `danger` solo para acciones destructivas confirmadas (p. ej. "Rechazar solicitud"). */
  variant?: 'primary' | 'secondary' | 'danger';
  /** `sm` para acciones dentro de filas de tabla en escritorio; en móvil se usa `md` (48px). */
  size?: 'md' | 'sm';
  /** Ícono a la izquierda del texto (el `icon` normal va a la derecha). */
  leadingIcon?: string;
  isLoading?: boolean;
  loadingText?: string;
  icon?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      icon,
      leadingIcon,
      fullWidth = true,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const sizeStyles =
      size === 'md'
        ? 'min-h-[48px] h-12 text-sm sm:text-base px-4'
        : 'min-h-[40px] h-10 text-sm px-3';
    const baseStyles = `${sizeStyles} rounded-lg font-semibold whitespace-nowrap transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none focus-ring-custom`;

    const variantStyles = {
      primary:
        'bg-[#0F6E6E] hover:bg-[#0B5858] active:bg-[#084747] text-white shadow-sm disabled:opacity-75',
      secondary:
        'bg-white hover:bg-[#E6F2F1] text-[#0F6E6E] border border-[#0F6E6E] active:bg-[#E6F2F1]/80 disabled:opacity-50',
      danger: 'bg-[#B42318] hover:bg-[#912018] active:bg-[#7A1A14] text-white shadow-sm disabled:opacity-75',
    }[variant];

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${widthStyle} ${className}`}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading ? (
          <>
            <svg
              aria-hidden="true"
              className="animate-spin h-5 w-5 text-current shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leadingIcon && (
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] shrink-0"
              >
                {leadingIcon}
              </span>
            )}
            <span>{children}</span>
            {icon && (
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] shrink-0"
              >
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
