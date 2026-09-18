import React from 'react';

interface SiteCardProps {
  name: string;
  address: string;
}

export const SiteCard: React.FC<SiteCardProps> = ({ name, address }) => {
  return (
    <div className="bg-[#002020]/40 border border-[#0F6E6E]/30 rounded-lg p-4 flex items-start gap-3 transition-colors">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[#A1F0EF] text-[20px] mt-0.5 flex-shrink-0 select-none"
      >
        location_on
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[#F2F7F7]">{name}</span>
        <span className="text-xs text-[#A9C5C5] mt-1 leading-normal">{address}</span>
      </div>
    </div>
  );
};
