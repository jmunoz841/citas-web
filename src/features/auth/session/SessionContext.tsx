import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SessionResponse } from '../api/types';
import { clearSession, getCurrentSession, hasSession, logoutSession } from './sessionManager';
import { setExpiredSessionListener } from '../../../shared/api/apiClient';

export type Role = 'ADMIN' | 'PROFESSIONAL' | 'USER';

type Status = 'loading' | 'authenticated' | 'anonymous' | 'unreachable';

interface SessionContextValue {
  status: Status;
  session: SessionResponse | null;
  /** Vuelve a pedir la sesión: tras iniciar sesión o tras un fallo de red. */
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Ruta de inicio de cada rol. Un usuario con varios roles entra por el de más privilegio. */
export function homePathFor(roles: string[]): string {
  if (roles.includes('ADMIN')) return '/admin/solicitudes';
  if (roles.includes('PROFESSIONAL')) return '/agenda';
  return '/inicio';
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<Status>(hasSession() ? 'loading' : 'anonymous');
  const [session, setSession] = useState<SessionResponse | null>(null);

  const reload = useCallback(async () => {
    if (!hasSession()) {
      setSession(null);
      setStatus('anonymous');
      return;
    }
    setStatus('loading');
    try {
      const current = await getCurrentSession();
      setSession(current);
      setStatus(current ? 'authenticated' : 'anonymous');
    } catch {
      // Red caída o 5xx: la sesión sigue siendo válida, solo no se pudo confirmar.
      setStatus('unreachable');
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setSession(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setExpiredSessionListener(() => {
      clearSession();
      setSession(null);
      setStatus('anonymous');
    });
    return () => setExpiredSessionListener(null);
  }, []);

  const value = useMemo(() => ({ status, session, reload, logout }), [status, session, reload, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>');
  }
  return ctx;
}

/** Nombre para mostrar: "Nombres Apellidos". */
export function displayName(session: SessionResponse | null): string {
  if (!session) return '';
  return `${session.firstNames ?? ''} ${session.lastNames ?? ''}`.trim() || session.email;
}

const FullPageStatus: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#F7F6F2] flex flex-col items-center justify-center gap-3 p-6 text-center">
    {children}
  </div>
);

/**
 * Protege una ruta por rol. Sin sesión → `/login`; con sesión de otro rol → su propio inicio.
 * Si la API no responde, muestra un aviso con reintento en lugar de cerrar la sesión.
 */
export const RequireRole: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => {
  const { status, session, reload } = useSession();

  useEffect(() => {
    // Recién iniciada la sesión en /login, el proveedor aún la cree anónima.
    if (status === 'anonymous' && hasSession()) {
      void reload();
    }
  }, [status, reload]);

  if (status === 'loading' || (status === 'anonymous' && hasSession())) {
    return (
      <FullPageStatus>
        <span aria-hidden="true" className="h-8 w-8 rounded-full border-4 border-[#E6F2F1] border-t-[#0F6E6E] animate-spin" />
        <p className="text-sm text-[#5B6573]" role="status">
          Cargando…
        </p>
      </FullPageStatus>
    );
  }
  if (status === 'unreachable') {
    return (
      <FullPageStatus>
        <p className="text-base font-semibold text-[#1C2430]" role="alert">
          No pudimos conectar con el servidor. Inténtalo de nuevo.
        </p>
        <button
          className="min-h-[48px] px-4 rounded-lg border border-[#0F6E6E] text-[#0F6E6E] font-semibold bg-white hover:bg-[#E6F2F1] focus-ring-custom"
          onClick={() => void reload()}
          type="button"
        >
          Reintentar
        </button>
      </FullPageStatus>
    );
  }
  if (status === 'anonymous' || !session) {
    return <Navigate replace to="/login" />;
  }
  if (!session.roles.includes(role)) {
    return <Navigate replace to={homePathFor(session.roles)} />;
  }
  return <>{children}</>;
};

/** `/`: lleva a cada quien a su inicio, o a `/login` si no hay sesión. */
export const RootRedirect: React.FC = () => {
  const { status, session, reload } = useSession();

  useEffect(() => {
    if (status === 'anonymous' && hasSession()) {
      void reload();
    }
  }, [status, reload]);

  if (status === 'authenticated' && session) {
    return <Navigate replace to={homePathFor(session.roles)} />;
  }
  if (status === 'anonymous' && !hasSession()) {
    return <Navigate replace to="/login" />;
  }
  if (status === 'unreachable') {
    return <RequireRole role="USER">{null}</RequireRole>;
  }
  return (
    <FullPageStatus>
      <span aria-hidden="true" className="h-8 w-8 rounded-full border-4 border-[#E6F2F1] border-t-[#0F6E6E] animate-spin" />
      <p className="text-sm text-[#5B6573]" role="status">
        Cargando…
      </p>
    </FullPageStatus>
  );
};
