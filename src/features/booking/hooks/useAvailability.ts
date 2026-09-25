import { useCallback, useEffect, useState } from 'react';
import { AvailabilityQuery, AvailabilitySlot, searchAvailability } from '../api/bookingApi';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';

export type AvailabilityStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AvailabilityState {
  status: AvailabilityStatus;
  items: AvailabilitySlot[];
  error: string | null;
}

/**
 * Busca los horarios reservables. Con `query` nulo no consulta. Ignora respuestas de una
 * consulta anterior si los filtros cambiaron mientras tanto.
 */
export function useAvailability(query: AvailabilityQuery | null) {
  const [state, setState] = useState<AvailabilityState>({ status: 'idle', items: [], error: null });
  const [reloadToken, setReloadToken] = useState(0);
  const queryKey = query ? JSON.stringify(query) : null;

  useEffect(() => {
    if (!queryKey) {
      setState({ status: 'idle', items: [], error: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading', items: [], error: null });
    searchAvailability(JSON.parse(queryKey) as AvailabilityQuery)
      .then((items) => {
        if (!cancelled) setState({ status: 'ready', items, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && !err.isConnectionProblem && err.detail ? err.detail : CONNECTION_ERROR_MESSAGE;
        setState({ status: 'error', items: [], error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { ...state, reload };
}
