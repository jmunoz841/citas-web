import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentTypes } from './useDocumentTypes';
import { CatalogsError, resetCatalogsApi } from '../api/catalogsApi';

// Componente mínimo para observar el hook sin arrastrar toda la página de registro.
function Sonda() {
  const { options, loading, failed } = useDocumentTypes();
  return (
    <div>
      <span data-testid="estado">{loading ? 'cargando' : failed ? 'fallo' : 'listo'}</span>
      <ul>
        {options.map((opt) => (
          <li key={opt.value}>{opt.label}</li>
        ))}
      </ul>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetCatalogsApi();
});

describe('useDocumentTypes', () => {
  it('carga los tipos de documento y los formatea como nombre mas codigo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ items: [{ code: 'CC', name: 'Cédula de ciudadanía' }] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    );

    render(<Sonda />);

    expect(screen.getByTestId('estado')).toHaveTextContent('cargando');
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('listo'));
    expect(screen.getByText('Cédula de ciudadanía (CC)')).toBeInTheDocument();
  });

  it('marca el fallo y deja la lista vacia si la API no responde', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new CatalogsError(0, 'sin red'))));

    render(<Sonda />);

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('fallo'));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
