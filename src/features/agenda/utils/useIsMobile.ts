import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

function matches(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/**
 * Móvil (<768px): la agenda muestra un día a la vez. Se renderiza solo una vista (no ambas
 * ocultas con CSS) para no duplicar bloques enfocables ni nombres accesibles.
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const onChange = () => setMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return mobile;
}
