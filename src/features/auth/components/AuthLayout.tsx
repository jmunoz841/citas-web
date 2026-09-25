import React, { useState } from 'react';
import { BrandMark } from '../../../shared/components/BrandMark';
import { SiteCard } from './SiteCard';
import { SiteChip } from './SiteChip';

interface AuthLayoutProps {
  children: React.ReactNode;
  cardMaxWidth?: '480px' | '640px';
}

// Preferencia de la persona usuaria (solo visual, sin datos sensibles); se recuerda entre pantallas.
const PANEL_COLLAPSED_KEY = 'citaclara_panel_sedes_plegado';

function readPanelCollapsed(): boolean {
  try {
    return localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writePanelCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(PANEL_COLLAPSED_KEY, String(collapsed));
  } catch {
    // almacenamiento no disponible: la preferencia solo dura en esta vista
  }
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  cardMaxWidth = '480px',
}) => {
  const maxWidthClass = cardMaxWidth === '640px' ? 'max-w-[640px]' : 'max-w-[480px]';
  // El plegado solo aplica en escritorio (≥1024px); en tablet y móvil el panel ya es una franja superior.
  const [collapsed, setCollapsed] = useState<boolean>(readPanelCollapsed);

  const togglePanel = () => {
    setCollapsed((prev) => {
      writePanelCollapsed(!prev);
      return !prev;
    });
  };

  const toggleLabel = collapsed ? 'Mostrar panel de sedes' : 'Ocultar panel de sedes';
  const hiddenWhenCollapsed = collapsed ? 'lg:hidden' : '';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F6F2]">
      {/* Panel de orientación: escritorio 5/12 o riel de 72px (plegado); tablet franja ~160px; móvil franja compacta */}
      <aside
        aria-label="Información de Sedes Clínicas"
        className={`w-full bg-[#0F3B3F] text-[#F2F7F7] flex flex-col justify-between p-4 sm:p-6 lg:min-h-screen shrink-0 overflow-hidden lg:transition-[width] lg:duration-200 lg:ease-out ${
          collapsed ? 'lg:w-[72px] lg:px-3 lg:py-8' : 'lg:w-5/12 lg:p-12'
        }`}
      >
        <div className="flex flex-col gap-4 lg:gap-8">
          {/* Marca, etiqueta y botón de plegado */}
          <header
            className={`flex items-center justify-between gap-3 ${
              collapsed ? 'lg:flex-col lg:justify-start lg:gap-6' : ''
            }`}
          >
            <BrandMark compactOnDesktop={collapsed} />
            <div className="flex items-center gap-2">
              <span
                className={`hidden md:inline-flex text-xs uppercase tracking-wider text-[#A9C5C5] bg-[#0F6E6E]/40 px-2.5 py-1 rounded-full font-medium select-none ${hiddenWhenCollapsed}`}
              >
                Sedes Clínicas
              </span>
              <button
                aria-controls="panel-sedes-contenido panel-sedes-pie"
                aria-expanded={!collapsed}
                aria-label={toggleLabel}
                className="hidden lg:inline-flex w-10 h-10 items-center justify-center rounded-lg text-[#A9C5C5] hover:text-[#F2F7F7] hover:bg-[#F2F7F7]/10 transition-colors duration-150 cursor-pointer focus-ring-custom"
                onClick={togglePanel}
                title={toggleLabel}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] select-none">
                  {collapsed ? 'left_panel_open' : 'left_panel_close'}
                </span>
              </button>
            </div>
          </header>

          <div className={`flex flex-col gap-4 lg:gap-8 ${hiddenWhenCollapsed}`} id="panel-sedes-contenido">
            {/* Lema: escritorio y tablet */}
            <div className="hidden md:block">
              <p className="text-xl lg:text-2xl font-bold text-[#F2F7F7] mb-1 leading-snug">
                Atención Médica Digital
              </p>
              <p className="text-sm lg:text-base text-[#A9C5C5] leading-relaxed max-w-md">
                Agenda tus citas médicas en dos sedes, sin filas ni llamadas.
              </p>
            </div>

            {/* Lema: solo móvil */}
            <div className="block md:hidden">
              <p className="text-xs text-[#A9C5C5] truncate">
                Agenda tus citas médicas en dos sedes, sin filas ni llamadas.
              </p>
            </div>

            {/* Chips de sedes: solo tablet (768px - 1023px) */}
            <div className="hidden md:flex lg:hidden flex-row flex-wrap gap-2.5 pt-1">
              <SiteChip name="HIC · Hospital Internacional de Colombia" />
              <SiteChip name="ICV · Instituto Cardiovascular" />
            </div>

            {/* Fichas de sedes: escritorio (>= 1024px) */}
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
        </div>

        {/* Pie del panel: escritorio y tablet */}
        <footer
          className={`hidden md:block pt-4 mt-6 border-t border-[#0F6E6E]/30 text-[13px] text-[#A9C5C5] ${hiddenWhenCollapsed}`}
          id="panel-sedes-pie"
        >
          Proyecto académico · Datos ficticios
        </footer>
      </aside>

      {/* Área del formulario: en móvil y tablet empieza justo debajo de la franja; en escritorio se centra */}
      <main className="w-full lg:flex-1 min-w-0 bg-[#F7F6F2] flex items-start lg:items-center justify-center p-3 sm:p-8 lg:p-12 lg:min-h-screen">
        <div className={`w-full ${maxWidthClass} mx-auto py-2 sm:py-6`}>
          {children}
        </div>
      </main>
    </div>
  );
};
