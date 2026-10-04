import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InsuranceCatalogPage } from './InsuranceCatalogPage';
import { mockApi, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const EPS = { id: 3, name: 'EPS Sintetica', active: true };
const PLAN = { id: 8, epsId: 3, name: 'Plan Basico', active: true };

beforeEach(() => signIn());
afterEach(() => { vi.unstubAllGlobals(); signOut(); });

describe('InsuranceCatalogPage (HU-007)', () => {
  it('permite crear, editar y desactivar planes sin eliminarlos', async () => {
    const calls = mockApi({
      'GET /api/v1/admin/eps': { body: { items: [EPS] } },
      'GET /api/v1/admin/eps/3/plans': { body: { items: [PLAN] } },
      'PATCH /api/v1/admin/eps/plans/8': { body: { ...PLAN, name: 'Plan Integral' } },
      'PATCH /api/v1/admin/eps/plans/8/active': { body: { ...PLAN, active: false } },
    });
    const user = userEvent.setup();
    renderWithProviders(<InsuranceCatalogPage />);

    await user.click(await screen.findByRole('button', { name: 'EPS Sintetica' }));
    expect(await screen.findByText('Plan Basico')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Editar' }).at(-1)!);
    const input = screen.getByLabelText('Nuevo nombre del plan');
    await user.clear(input); await user.type(input, 'Plan Integral');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Plan Integral')).toBeInTheDocument();
    expect(calls.find((call) => call.path === '/api/v1/admin/eps/plans/8')?.body).toEqual({ name: 'Plan Integral' });

    await user.click(screen.getAllByRole('button', { name: 'Desactivar' }).at(-1)!);
    await waitFor(() => expect(calls.find((call) => call.path === '/api/v1/admin/eps/plans/8/active')?.body).toEqual({ active: false }));
  });
});
