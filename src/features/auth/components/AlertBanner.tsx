import React from 'react';

interface AlertBannerProps {
  title: string;
  description: string;
  className?: string;
}

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ title, description, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        aria-live="polite"
        className={`bg-[#FEF3F2] border border-[#B42318]/40 text-[#B42318] rounded-lg p-3.5 sm:p-4 flex items-start gap-3 shadow-sm ${className}`}
        role="alert"
        tabIndex={-1}
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5 flex-shrink-0 text-[#B42318] mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <line
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            x1="12"
            x2="12"
            y1="8"
            y2="12"
          />
          <circle cx="12" cy="16" fill="currentColor" r="1" />
        </svg>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#B42318]">{title}</span>
          <p className="text-xs sm:text-sm text-[#B42318] mt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>
    );
  }
);

AlertBanner.displayName = 'AlertBanner';
