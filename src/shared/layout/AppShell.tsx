import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { apiRequest, ItemsResponse } from '../api/apiClient';
import { displayName, Role, useSession } from '../../features/auth/session/SessionContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: number | null;
}

interface ShellContextValue {
  /** Vuelve a contar las solicitudes pendientes (tras aprobar o rechazar). */
  refreshPendingCount: () => void;
}

const ShellContext = createContext<ShellContextValue>({ refreshPendingCount: () => undefined });

export function useShell(): ShellContextValue {
  return useContext(ShellContext);
}

const ROLE_CHIP: Record<Role, string> = {
  ADMIN: 'Administrador',
  PROFESSIONAL: 'Profesional',
  USER: 'Paciente',
};

function navFor(role: Role, pendingCount: number | null): NavItem[] {
  if (role === 'ADMIN') {
    return [
      { to: '/admin/solicitudes', label: 'Solicitudes pendientes', icon: 'inbox', badge: pendingCount },
      { to: '/admin/especialidades', label: 'Especialidades', icon: 'medical_services' },
      { to: '/admin/profesionales', label: 'Profesionales', icon: 'stethoscope' },
    ];
  }
  if (role === 'PROFESSIONAL') {
    return [{ to: '/agenda', label: 'Mi agenda', icon: 'calendar_month' }];
  }
  return [{ to: '/inicio', label: 'Inicio', icon: 'home' }];
}

const NavItems: React.FC<{ items: NavItem[]; compact?: boolean; onNavigate?: () => void }> = ({
  items,
  compact = false,
  onNavigate,
}) => (
  <ul className="flex flex-col gap-1 py-4">
    {items.map((item) => (
      <li key={item.to}>
        <NavLink
          aria-label={compact ? item.label : undefined}
          className={({ isActive }) =>
            `relative flex items-center gap-3 min-h-[48px] focus-ring-custom transition-colors duration-150 ${
              compact ? 'justify-center mx-2 rounded-lg' : 'pl-5 pr-4'
            } ${
              isActive
                ? 'bg-[#E6F2F1] text-[#0F6E6E] font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#0F6E6E]'
                : 'text-[#1C2430] hover:bg-[#F7F6F2]'
            }`
          }
          onClick={onNavigate}
          title={compact ? item.label : undefined}
          to={item.to}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[22px] shrink-0">
            {item.icon}
          </span>
          {!compact && <span className="flex-1 text-[15px] whitespace-nowrap">{item.label}</span>}
          {!compact && item.badge != null && item.badge > 0 && (
            <span className="min-w-[24px] h-6 px-1.5 rounded-md bg-[#E6F2F1] text-[#0F6E6E] text-xs font-semibold flex items-center justify-center tabular-nums">
              <span className="sr-only">, </span>
              {item.badge}
            </span>
          )}
          {compact && item.badge != null && item.badge > 0 && (
            <span className="absolute top-2 right-3 h-2.5 w-2.5 rounded-full bg-[#0F6E6E]">
              <span className="sr-only">{item.badge} pendientes</span>
            </span>
          )}
        </NavLink>
      </li>
    ))}
  </ul>
);

/**
 * Estructura de la app autenticada (DESIGN.md § Áreas autenticadas): barra superior con marca,
 * rol, usuario y "Cerrar sesión"; riel de navegación de 240px en escritorio, de íconos en tablet
 * y cajón en móvil. El panel oscuro de sedes es solo de login y registro.
 */
export const AppShell: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const refreshPendingCount = useCallback(() => {
    if (role !== 'ADMIN') return;
    apiRequest<ItemsResponse<unknown>>('/api/v1/admin/appointments/requests')
      .then((res) => setPendingCount(res.items.length))
      .catch(() => setPendingCount(null));
  }, [role]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (role !== 'PROFESSIONAL') return;
    apiRequest<{ primarySpecialty: { name: string } }>('/api/v1/professional/me')
      .then((me) => setSubtitle(me.primarySpecialty?.name ?? null))
      .catch(() => setSubtitle(null));
  }, [role]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const items = navFor(role, pendingCount);
  const name = displayName(session);

  return (
    <ShellContext.Provider value={{ refreshPendingCount }}>
      <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
        <header className="h-16 bg-white border-b border-[#D9DDE3] flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30">
          <button
            aria-expanded={drawerOpen}
            aria-label="Abrir menú"
            className="md:hidden h-11 w-11 -ml-2 rounded-lg flex items-center justify-center text-[#1C2430] hover:bg-[#F7F6F2] focus-ring-custom"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
              menu
            </span>
          </button>
          <BrandMark tone="light" />
          <span className="hidden sm:block h-6 w-px bg-[#D9DDE3]" aria-hidden="true" />
          <span className="hidden sm:inline-flex items-center rounded-md bg-[#E6F2F1] text-[#0F6E6E] text-xs font-semibold uppercase tracking-[0.08em] px-2.5 py-1 whitespace-nowrap">
            {ROLE_CHIP[role]}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="h-9 w-9 rounded-full bg-[#0F6E6E] text-white flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </span>
            <div className="hidden sm:flex flex-col min-w-0 leading-tight">
              <span className="text-sm font-semibold text-[#1C2430] whitespace-nowrap truncate">{name}</span>
              {subtitle && <span className="text-xs text-[#5B6573] whitespace-nowrap truncate">{subtitle}</span>}
            </div>
          </div>
          <span className="hidden sm:block h-6 w-px bg-[#D9DDE3]" aria-hidden="true" />
          <button
            className="min-h-[44px] px-2 sm:px-3 rounded-lg text-sm font-semibold text-[#5B6573] hover:text-[#1C2430] hover:bg-[#F7F6F2] focus-ring-custom whitespace-nowrap disabled:opacity-60"
            disabled={loggingOut}
            onClick={handleLogout}
            type="button"
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </header>

        <div className="flex flex-1 min-h-0">
          <nav aria-label="Navegación principal" className="hidden md:block shrink-0 bg-white border-r border-[#D9DDE3] w-[72px] lg:w-[240px]">
            <div className="lg:hidden">
              <NavItems compact items={items} />
            </div>
            <div className="hidden lg:block">
              <NavItems items={items} />
            </div>
          </nav>

          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-[1200px] mx-auto">{children}</div>
          </main>
        </div>

        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div aria-hidden="true" className="absolute inset-0 bg-[#1C2430]/50" onClick={() => setDrawerOpen(false)} />
            <nav aria-label="Navegación principal" className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-xl flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b border-[#D9DDE3]">
                <BrandMark tone="light" />
                <button
                  aria-label="Cerrar menú"
                  className="h-11 w-11 rounded-lg flex items-center justify-center text-[#5B6573] hover:bg-[#F7F6F2] focus-ring-custom"
                  onClick={() => setDrawerOpen(false)}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                    close
                  </span>
                </button>
              </div>
              <div className="px-5 pt-4 flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#1C2430]">{name}</span>
                <span className="self-start rounded-md bg-[#E6F2F1] text-[#0F6E6E] text-xs font-semibold uppercase tracking-[0.08em] px-2 py-0.5">
                  {ROLE_CHIP[role]}
                </span>
              </div>
              <NavItems items={items} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
};
