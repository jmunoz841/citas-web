import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 5000;

/**
 * Avisos breves tras una acción ("Cita aprobada…"). Se anuncian con `role="status"` sin robar
 * el foco; los errores que exigen atención van en un banner, no aquí.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] flex justify-center sm:justify-end pointer-events-none">
        {toast && (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-md w-full sm:w-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_8px_24px_rgba(28,36,48,0.14)] ${
              toast.tone === 'success'
                ? 'bg-[#ECF7F1] border-[#1E7B4F]/40 text-[#1E7B4F]'
                : 'bg-[#FEF3F2] border-[#B42318]/40 text-[#B42318]'
            }`}
            role="status"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] shrink-0">
              {toast.tone === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className="text-sm font-semibold leading-snug">{toast.message}</p>
            <button
              aria-label="Cerrar aviso"
              className="ml-2 -mr-1 h-6 w-6 rounded flex items-center justify-center hover:bg-black/5 focus-ring-custom"
              onClick={() => setToast(null)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}
