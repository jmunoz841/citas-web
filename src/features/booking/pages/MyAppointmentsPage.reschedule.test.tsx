import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyAppointmentsPage } from './MyAppointmentsPage';
import { mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const SESSION = { userId: 5, email: 'ana@example.test', firstNames: 'Ana', lastNames: 'Perez', roles: ['USER'] };

/** Cita aprobada en el futuro lejano: siempre reprogramable. */
const APPOINTMENT = {
  id: 31,
  status: 'APPROVED',
  professionalName: 'Laura Gomez',
  specialtyName: 'Cardiologia',
  siteCode: 'HIC',
  siteName: 'Hospital Internacional de Colombia',
  date: '2030-01-15',
  startTime: '08:00',
  endTime: '09:00',
  durationMinutes: 60,
  rejectionReason: null,
  professionalId: 12,
  specialtyId: 4,
  reschedule: null,
};

const SLOT = {
  professionalId: 12,
  professionalName: 'Laura Gomez',
  specialtyId: 4,
  specialtyName: 'Cardiologia',
  type: 'SPECIALIZED',
  durationMinutes: 60,
  siteCode: 'ICV',
  date: '2030-01-16',
  startTime: '14:00',
  endTime: '15:00',
};

const REQUESTED = {
  id: 7,
  appointmentId: 31,
  status: 'PENDING',
  originalDate: '2030-01-15',
  originalStartTime: '08:00',
  originalSiteCode: 'HIC',
  requestedDate: '2030-01-16',
  requestedStartTime: '14:00',
  requestedSiteCode: 'ICV',
};

function routes(appointment: object, extra: Record<string, unknown> = {}) {
  return {
    'GET /api/v1/auth/session': { body: SESSION },
    'GET /api/v1/appointments': { body: { items: [appointment] } },
    'GET /api/v1/appointments/31': { body: appointment },
    'GET /api/v1/appointments/31/history': { body: { items: [] } },
    ...extra,
  } as Parameters<typeof mockApi>[0];
}

async function openDetail(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Ver detalle de Cardiologia' }));
  return screen.findByRole('region', { name: 'Detalle de cita' });
}

describe('MyAppointmentsPage — reprogramación (HU-018)', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.unstubAllGlobals();
    signOut();
  });

  it('CA-01 busca franjas del mismo profesional y especialidad, envía la elegida y muestra la solicitud pendiente', async () => {
    const calls = mockApi(
      routes(APPOINTMENT, {
        'GET /api/v1/availability': { body: { items: [SLOT] } },
        'POST /api/v1/appointments/31/reschedule-requests': { status: 201, body: REQUESTED },
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    await user.click(within(detail).getByRole('button', { name: 'Reprogramar' }));
    const submit = within(detail).getByRole('button', { name: /Solicitar reprogramación/ });
    expect(submit).toBeDisabled();

    fireEvent.change(within(detail).getByLabelText('Nueva fecha'), { target: { value: '2030-01-16' } });
    await user.click(await within(detail).findByRole('radio', { name: /14:00 – 15:00/ }));
    const search = calls.find((c) => c.path === '/api/v1/availability');
    expect(search?.query.get('date')).toBe('2030-01-16');
    expect(search?.query.get('professionalId')).toBe('12');
    expect(search?.query.get('specialtyId')).toBe('4');

    await user.click(submit);

    expect(await within(detail).findByText('Reprogramación pendiente de aprobación')).toBeInTheDocument();
    expect(
      within(detail).getByText(/Pediste cambiar tu cita al 16\/01\/2030 14:00 · ICV\. Conservas tu horario actual/),
    ).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ siteCode: 'ICV', date: '2030-01-16', startTime: '14:00' });
    // Con una solicitud pendiente ya no se ofrece otra; el listado lo señala.
    expect(within(detail).queryByRole('button', { name: 'Reprogramar' })).not.toBeInTheDocument();
    expect(screen.getByText('Reprogramación pendiente')).toBeInTheDocument();
  });

  it('CA-03 si la franja se ocupó, avisa y vuelve a cargar los horarios', async () => {
    let searches = 0;
    mockApi(
      routes(APPOINTMENT, {
        'GET /api/v1/availability': () => ({ body: { items: ++searches === 1 ? [SLOT] : [] } }),
        'POST /api/v1/appointments/31/reschedule-requests': problem(409, 'SLOT_UNAVAILABLE'),
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    await user.click(within(detail).getByRole('button', { name: 'Reprogramar' }));
    fireEvent.change(within(detail).getByLabelText('Nueva fecha'), { target: { value: '2030-01-16' } });
    await user.click(await within(detail).findByRole('radio', { name: /14:00 – 15:00/ }));
    await user.click(within(detail).getByRole('button', { name: /Solicitar reprogramación/ }));

    expect(await within(detail).findByText('Ese horario ya no está disponible')).toBeInTheDocument();
    expect(await within(detail).findByText('No hay horarios disponibles ese día. Prueba con otra fecha.')).toBeInTheDocument();
    await waitFor(() => expect(searches).toBe(2));
  });

  it('CA-04 una solicitud pendiente en el servidor se informa con su mensaje', async () => {
    mockApi(
      routes(APPOINTMENT, {
        'GET /api/v1/availability': { body: { items: [SLOT] } },
        'POST /api/v1/appointments/31/reschedule-requests': problem(409, 'RESCHEDULE_ALREADY_PENDING'),
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    await user.click(within(detail).getByRole('button', { name: 'Reprogramar' }));
    fireEvent.change(within(detail).getByLabelText('Nueva fecha'), { target: { value: '2030-01-16' } });
    await user.click(await within(detail).findByRole('radio', { name: /14:00 – 15:00/ }));
    await user.click(within(detail).getByRole('button', { name: /Solicitar reprogramación/ }));

    expect(await within(detail).findByText('Ya tienes una reprogramación pendiente')).toBeInTheDocument();
  });

  it('HU-019 muestra el rechazo con su motivo y permite pedir otra franja', async () => {
    mockApi(
      routes({
        ...APPOINTMENT,
        reschedule: {
          id: 7,
          status: 'REJECTED',
          requestedDate: '2030-01-16',
          requestedStartTime: '14:00',
          requestedSiteCode: 'ICV',
          decisionReason: 'El profesional no puede ese día',
        },
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    expect(within(detail).getByText('Reprogramación rechazada')).toBeInTheDocument();
    expect(within(detail).getByText('El profesional no puede ese día. Conservas tu horario actual.')).toBeInTheDocument();
    expect(within(detail).getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument();
  });

  it('D-033 una reprogramación cerrada sin decisión se explica al paciente', async () => {
    mockApi(
      routes({
        ...APPOINTMENT,
        reschedule: {
          id: 7,
          status: 'CANCELLED',
          requestedDate: '2030-01-16',
          requestedStartTime: '14:00',
          requestedSiteCode: 'ICV',
          decisionReason: null,
        },
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    expect(within(detail).getByText('Reprogramación cerrada')).toBeInTheDocument();
    expect(within(detail).getByText(/Tu solicitud para el 16\/01\/2030 14:00 · ICV se cerró sin decisión/)).toBeInTheDocument();
  });

  it('una cita no aprobada o pasada no ofrece reprogramar', async () => {
    mockApi(routes({ ...APPOINTMENT, status: 'REQUESTED' }));
    const user = userEvent.setup();
    renderWithProviders(<MyAppointmentsPage />, { withSession: true });

    const detail = await openDetail(user);
    expect(within(detail).getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument();
    expect(within(detail).queryByRole('button', { name: 'Reprogramar' })).not.toBeInTheDocument();
  });
});
