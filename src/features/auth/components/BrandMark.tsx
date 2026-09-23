import React from 'react';

interface BrandMarkProps {
  className?: string;
  /** Oculta el texto "CitaClara" en escritorio (panel plegado); el nombre queda para lectores de pantalla. */
  compactOnDesktop?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = '', compactOnDesktop = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 32px rounded-square #0F6E6E mark with white cross */}
      <svg
        aria-hidden="true"
        className="w-8 h-8 flex-shrink-0"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect fill="#0F6E6E" height="32" rx="8" width="32" />
        <path
          d="M16 8V24M8 16H24"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      </svg>
      <div
        className={`text-[22px] tracking-tight leading-none select-none items-center ${
          compactOnDesktop ? 'flex lg:sr-only' : 'flex'
        }`}
      >
        <span className="font-bold text-[#F2F7F7]">Cita</span>
        <span className="font-normal text-[#A9C5C5]">Clara</span>
      </div>
    </div>
  );
};
