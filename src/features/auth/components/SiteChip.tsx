import React from 'react';

interface SiteChipProps {
  name: string;
}

export const SiteChip: React.FC<SiteChipProps> = ({ name }) => {
  return (
    <div className="bg-[#002020]/50 border border-[#0F6E6E]/40 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-[#F2F7F7]">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[#A1F0EF] text-[18px] select-none"
      >
        location_on
      </span>
      <span className="font-medium">{name}</span>
    </div>
  );
};
