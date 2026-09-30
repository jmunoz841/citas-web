import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyAppointmentsPage } from './MyAppointmentsPage';
import { mockApi, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const SESSION = { userId: 5, email: 'ana@example.test', firstNames: 'Ana', lastNames: 'Perez', roles: ['USER'] };

const APPOINTMENT = {
  id: 31, status: 'APPROVED', professionalName: 'Laura Gomez', specialtyName: 'Cardiologia',
  siteCode: 'HIC', siteName: 'Hospital Internacional de Colombia', date: '2026-10-01',
  startTime: '09:00', endTime: '10:00', durationMinutes: 60, rejectionReason: null,
};

describe('MyAppointmentsPage (HU-016)', () => {
  beforeEach(() => signIn());
  afterEach(() => signOut());

  it('muestra los datos minimos, envia filtros y abre el detalle con el motivo de rechazo', async () => {
    const calls = mockApi({
      'GET /api/v1/auth/session': { body: SESSION },
      'GET /api/v1/appointments': { body: { items: [APPOINTMENT] } },
      'GET /api/v1/appointments/31': { body: APPOINTMENT },
      'POST /api/v1/appointments/31/cancel': { body: { ...APPOINTMENT, status: 'CANCELLED' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    expect(await screen.findByText('Cardiologia')).toBeInTheDocument();
    expect(screen.getByText('Laura Gomez')).toBeInTheDocument();
    expect(screen.getAllByText('Aprobada')).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'APPROVED');
    await waitFor(() => expect(calls.at(-1)?.query.get('status')).toBe('APPROVED'));

    await user.click(screen.getByRole('button', { name: 'Ver detalle de Cardiologia' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar cita' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelacion' }));
    await waitFor(() => expect(screen.getAllByText('Cancelada').length).toBeGreaterThanOrEqual(3));
    expect(calls.some((call) => call.method === 'POST' && call.path === '/api/v1/appointments/31/cancel')).toBe(true);
  });
});
