import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
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
      isLoading = false,
      loadingText,
      icon,
      fullWidth = true,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const baseStyles =
      'min-h-[48px] h-12 rounded-lg font-semibold text-sm sm:text-base px-4 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none focus-ring-custom';

    const variantStyles =
      variant === 'primary'
        ? 'bg-[#0F6E6E] hover:bg-[#0B5858] active:bg-[#084747] text-white shadow-sm disabled:opacity-75'
        : 'bg-white hover:bg-[#E6F2F1] text-[#0F6E6E] border border-[#0F6E6E] active:bg-[#E6F2F1]/80 disabled:opacity-50';

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
