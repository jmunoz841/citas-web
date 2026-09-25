import { useEffect, useState } from 'react';
import { getCatalogsApi } from '../api/catalogsApi';

export interface DocumentTypeOption {
  value: string;
  label: string;
}

interface DocumentTypesState {
  options: DocumentTypeOption[];
  loading: boolean;
  failed: boolean;
}

/**
 * Tipos de documento del catálogo fijo de `citas-api` (HU-005). Antes estaban incrustados en
 * el formulario; ahora la fuente es la API, para que backend y frontend no puedan divergir.
 */
export function useDocumentTypes(): DocumentTypesState {
  const [options, setOptions] = useState<DocumentTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    getCatalogsApi()
      .documentTypes()
      .then((entries) => {
        if (!active) return;
        setOptions(entries.map((entry) => ({ value: entry.code, label: `${entry.name} (${entry.code})` })));
        setFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setOptions([]);
        setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { options, loading, failed };
}
