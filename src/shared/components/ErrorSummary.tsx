import React from 'react';

export interface ErrorSummaryItem {
  fieldId: string;
  label: string;
  reason?: string;
}

interface ErrorSummaryProps {
  title?: string;
  items: ErrorSummaryItem[];
  onItemClick?: (fieldId: string) => void;
  className?: string;
}

export const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    {
      title = 'Revisa los campos marcados:',
      items,
      onItemClick,
      className = '',
    },
    ref
  ) => {
    if (!items.length) return null;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, fieldId: string) => {
      e.preventDefault();
      if (onItemClick) {
        onItemClick(fieldId);
      } else {
        const el = document.getElementById(fieldId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    return (
      <div
        ref={ref}
        aria-live="assertive"
        className={`mb-5 p-4 rounded-xl bg-[#FEF3F2] border border-[#B42318]/40 text-[#B42318] flex items-start gap-3 shadow-sm ${className}`}
        role="alert"
        tabIndex={-1}
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[24px] shrink-0 text-[#B42318] select-none"
        >
          error
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-[#B42318] leading-tight">{title}</h3>
          <ul className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1 list-none p-0 m-0 text-[#B42318] font-medium">
            {items.map((item) => (
              <li key={item.fieldId} className="flex items-center gap-1">
                <span aria-hidden="true">•</span>
                <a
                  className="underline hover:text-[#8A1B12] font-semibold focus:outline-none focus:ring-2 focus:ring-[#B42318] rounded"
                  href={`#${item.fieldId}`}
                  onClick={(e) => handleClick(e, item.fieldId)}
                >
                  {item.label}
                </a>
                {item.reason && (
                  <span className="text-xs opacity-90">({item.reason})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
);

ErrorSummary.displayName = 'ErrorSummary';
