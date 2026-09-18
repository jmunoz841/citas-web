/**
 * TEMPORARY PAGE: /inicio
 * This is a minimal placeholder using the approved CitaClara design shell and tokens.
 * To be replaced by the full patient dashboard in a later story.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionResponse } from '../features/auth/api/types';
import { getCurrentSession, logoutSession } from '../features/auth/session/sessionManager';
import { AuthLayout } from '../features/auth/components/AuthLayout';
import { Card } from '../features/auth/components/Card';
import { Button } from '../features/auth/components/Button';

export const InicioPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const current = await getCurrentSession();
        if (!isMounted) return;

        if (!current) {
          navigate('/login', { replace: true });
          return;
        }

        setSession(current);
      } catch {
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutSession();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthLayout cardMaxWidth="480px">
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg
              aria-hidden="true"
              className="animate-spin h-8 w-8 text-[#0F6E6E]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            <p className="text-sm text-[#5B6573]">Cargando sesión…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F2F1] text-[#0F6E6E] text-xs font-semibold uppercase tracking-wider mb-3">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[16px]"
                >
                  check_circle
                </span>
                <span>Sesión activa</span>
              </div>
              <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em]">
                Sesión iniciada
              </h1>
              <p className="text-sm sm:text-base text-[#5B6573] mt-1 leading-relaxed">
                Has ingresado como{' '}
                <strong className="text-[#1C2430] font-semibold">
                  {session?.email || 'usuario'}
                </strong>
                .
              </p>
            </div>

            <div className="bg-[#F7F6F2] rounded-lg p-4 border border-[#D9DDE3] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#5B6573] uppercase tracking-wider">
                Detalles del usuario
              </span>
              <div className="text-xs text-[#1C2430] font-mono">
                <div>ID: {session?.userId}</div>
                <div>Roles: {session?.roles.join(', ') || 'PACIENTE'}</div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                icon="logout"
                isLoading={isLoggingOut}
                loadingText="Cerrando sesión…"
                onClick={handleLogout}
                type="button"
                variant="secondary"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
};
