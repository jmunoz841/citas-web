import React from 'react';

export type AlertTone = 'error' | 'warning' | 'info' | 'success';

interface AlertBannerProps {
  title: string;
  description: string;
  /** `error` por defecto (login y registro). El estado nunca se comunica solo con color: siempre ícono + texto. */
  tone?: AlertTone;
  className?: string;
  children?: React.ReactNode;
}

const TONES: Record<AlertTone, { box: string; text: string; icon: string }> = {
  error: { box: 'bg-[#FEF3F2] border-[#B42318]/40', text: 'text-[#B42318]', icon: 'error' },
  warning: { box: 'bg-[#FFF8ED] border-[#A15C00]/40', text: 'text-[#A15C00]', icon: 'warning' },
  info: { box: 'bg-[#E6F2F1] border-[#0F6E6E]/30', text: 'text-[#0F6E6E]', icon: 'info' },
  success: { box: 'bg-[#ECF7F1] border-[#1E7B4F]/40', text: 'text-[#1E7B4F]', icon: 'check_circle' },
};

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ title, description, tone = 'error', className = '', children }, ref) => {
    const styles = TONES[tone];
    return (
      <div
        ref={ref}
        aria-live="polite"
        className={`${styles.box} border rounded-lg p-3.5 sm:p-4 flex items-start gap-3 shadow-sm ${className}`}
        role="alert"
        tabIndex={-1}
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${styles.text}`}
        >
          {styles.icon}
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className={`text-sm font-semibold ${styles.text}`}>{title}</span>
            <p className={`text-xs sm:text-sm mt-0.5 leading-snug ${styles.text}`}>{description}</p>
          </div>
          {children}
        </div>
      </div>
    );
  }
);

AlertBanner.displayName = 'AlertBanner';
