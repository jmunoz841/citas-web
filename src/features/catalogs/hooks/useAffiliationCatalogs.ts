import { useEffect, useState } from 'react';
import { getCatalogsApi, type CatalogEntry, type InsurancePlan } from '../api/catalogsApi';

interface AffiliationCatalogsState {
  plans: InsurancePlan[];
  regimes: CatalogEntry[];
  loading: boolean;
  failed: boolean;
}

/**
 * Planes de EPS y regímenes para la afiliación opcional del registro (HU-004).
 *
 * El régimen se pide aparte porque no lo determina el plan: es un hecho del afiliado y una
 * misma EPS opera en contributivo y en subsidiado.
 *
 * Si la carga falla no se bloquea el registro: la afiliación es opcional, así que la sección
 * simplemente no se ofrece.
 */
export function useAffiliationCatalogs(): AffiliationCatalogsState {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [regimes, setRegimes] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const api = getCatalogsApi();

    Promise.all([api.insurancePlans(), api.regimes()])
      .then(([planList, regimeList]) => {
        if (!active) return;
        setPlans(planList);
        setRegimes(regimeList);
        setFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
        setRegimes([]);
        setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { plans, regimes, loading, failed };
}
