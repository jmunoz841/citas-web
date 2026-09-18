import React from 'react';
import { BrandMark } from './BrandMark';
import { SiteCard } from './SiteCard';
import { SiteChip } from './SiteChip';

interface AuthLayoutProps {
  children: React.ReactNode;
  cardMaxWidth?: '480px' | '640px';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  cardMaxWidth = '480px',
}) => {
  const maxWidthClass = cardMaxWidth === '640px' ? 'max-w-[640px]' : 'max-w-[480px]';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F6F2]">
      {/* Left Panel (Desktop 5/12, Tablet top band ~160px, Mobile ~64px compact bar) */}
      <aside
        aria-label="Información de Sedes Clínicas"
        className="w-full lg:w-5/12 bg-[#0F3B3F] text-[#F2F7F7] flex flex-col justify-between p-4 sm:p-6 lg:p-12 lg:min-h-screen shrink-0"
      >
        <div className="flex flex-col gap-4 lg:gap-8">
          {/* Top / Wordmark Area */}
          <header className="flex items-center justify-between">
            <BrandMark />
            <span className="hidden md:inline-flex lg:inline-flex text-xs uppercase tracking-wider text-[#A9C5C5] bg-[#0F6E6E]/40 px-2.5 py-1 rounded-full font-medium select-none">
              Sedes Clínicas
            </span>
          </header>

          {/* Statement: Desktop and Tablet */}
          <div className="hidden md:block">
            <p className="text-xl lg:text-2xl font-bold text-[#F2F7F7] mb-1 leading-snug">
              Atención Médica Digital
            </p>
            <p className="text-sm lg:text-base text-[#A9C5C5] leading-relaxed max-w-md">
              Agenda tus citas médicas en dos sedes, sin filas ni llamadas.
            </p>
          </div>

          {/* Mobile statement only */}
          <div className="block md:hidden">
            <p className="text-xs text-[#A9C5C5] truncate">
              Agenda tus citas médicas en dos sedes, sin filas ni llamadas.
            </p>
          </div>

          {/* Tablet Compact Chips (768px - 1023px) */}
          <div className="hidden md:flex lg:hidden flex-row flex-wrap gap-2.5 pt-1">
            <SiteChip name="HIC · Hospital Internacional de Colombia" />
            <SiteChip name="ICV · Instituto Cardiovascular" />
          </div>

          {/* Desktop Cards (>= 1024px) */}
          <div className="hidden lg:grid grid-cols-1 gap-4 pt-2">
            <SiteCard
              address="Km 7 Autopista Bucaramanga–Piedecuesta, Valle de Menzulí, Santander"
              name="HIC — Hospital Internacional de Colombia"
            />
            <SiteCard
              address="Calle 155A No. 23-58, Urbanización El Bosque, Floridablanca, Santander"
              name="ICV — Instituto Cardiovascular"
            />
          </div>
        </div>

        {/* Left Panel Footer: Desktop & Tablet only */}
        <footer className="hidden md:block pt-4 mt-6 border-t border-[#0F6E6E]/30 text-[13px] text-[#A9C5C5]">
          Proyecto académico · Datos ficticios
        </footer>
      </aside>

      {/* Right Area (Main Form & Content) */}
      {/* En móvil y tablet el formulario empieza justo debajo de la franja; en escritorio se centra. */}
      <main className="w-full lg:w-7/12 bg-[#F7F6F2] flex items-start lg:items-center justify-center p-3 sm:p-8 lg:p-12 lg:min-h-screen">

        <div className={`w-full ${maxWidthClass} mx-auto py-2 sm:py-6`}>
          {children}
        </div>
      </main>
    </div>
  );
};
