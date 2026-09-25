import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface RemoteData<T> {
  status: LoadStatus;
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  reload: () => Promise<void>;
}

/**
 * Carga datos de la API al montar y permite recargarlos. Un fallo deja `status: 'error'` para
 * mostrar el banner de conexión con "Reintentar"; nunca cierra la sesión. `loader` debe ser
 * estable (una función de módulo).
 */
export function useRemoteData<T>(loader: () => Promise<T>, initial: T): RemoteData<T> {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [data, setData] = useState<T>(initial);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await loader();
      if (!mounted.current) return;
      setData(result);
      setStatus('ready');
    } catch {
      if (mounted.current) setStatus('error');
    }
  }, [loader]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { status, data, setData, reload };
}
