import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestsPage } from './RequestsPage';
import { mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const REQUESTS = 'GET /api/v1/admin/appointments/requests';
const RESCHEDULES = 'GET /api/v1/admin/reschedule-requests';

const ANA = {
  id: 31,
  status: 'REQUESTED',
  patientName: 'Ana Pérez',
  professionalName: 'Laura Gómez',
  specialtyName: 'Cardiología',
  siteCode: 'HIC',
  date: '2026-10-08',
  startTime: '09:00',
  endTime: '10:00',
  durationMinutes: 60,
};

const REPROGRAMACION = {
  id: 7,
  appointmentId: 40,
  status: 'PENDING',
  patientName: 'Carlos Rojas',
  professionalName: 'Laura Gómez',
  specialtyName: 'Cardiología',
  durationMinutes: 60,
  originalDate: '2026-10-06',
  originalStartTime: '08:00',
  originalSiteCode: 'HIC',
  requestedDate: '2026-10-09',
  requestedStartTime: '14:00',
  requestedSiteCode: 'ICV',
  requestedAt: '2026-10-04T16:20:11',
};

const PROFESSIONALS = {
  items: [
    {
      id: 12,
      firstNames: 'Laura',
      lastNames: 'Gómez',
      email: 'laura@test.local',
      professionalCode: 'P-1',
      licenseNumber: 'L-1',
      active: true,
      specialties: [{ specialtyId: 4, primary: true }],
      siteCodes: ['HIC', 'ICV'],
    },
  ],
};

const SPECIALTIES = { items: [{ id: 4, name: 'Cardiología', durationMinutes: 60, general: false, active: true }] };

const OPTIONS = {
  'GET /api/v1/admin/professionals': { body: PROFESSIONALS },
  'GET /api/v1/admin/specialties': { body: SPECIALTIES },
};

beforeEach(() => signIn());

afterEach(() => {
  vi.unstubAllGlobals();
  signOut();
});

async function openReschedulesTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: /Reprogramaciones/ }));
  return screen.findByRole('table');
}

describe('RequestsPage — bandeja (HU-019, HU-022)', () => {
  it('HU-022 CA-01 muestra solicitudes y reprogramaciones pendientes en pestañas', async () => {
    const calls = mockApi({
      ...OPTIONS,
      [REQUESTS]: { body: { items: [ANA] } },
      [RESCHEDULES]: { body: { items: [REPROGRAMACION] } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    expect(within(await screen.findByRole('table')).getByText('Ana Pérez')).toBeInTheDocument();
    // La pestaña de reprogramaciones no se consulta hasta abrirla.
    expect(calls.some((c) => c.path === '/api/v1/admin/reschedule-requests')).toBe(false);

    const table = await openReschedulesTab(user);
    const row = within(table).getByText('Carlos Rojas').closest('tr') as HTMLElement;
    expect(within(row).getByText('06/10/2026 08:00 · HIC')).toBeInTheDocument();
    expect(within(row).getByText('09/10/2026 14:00 · ICV')).toBeInTheDocument();
    expect(within(row).getByText('60 min')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Reprogramaciones/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('HU-022 CA-02 los filtros combinados viajan como parámetros a ambas listas', async () => {
    const calls = mockApi({
      ...OPTIONS,
      [REQUESTS]: { body: { items: [ANA] } },
      [RESCHEDULES]: { body: { items: [] } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);
    await screen.findByRole('table');
    await screen.findByRole('option', { name: 'Laura Gómez' });

    await user.selectOptions(screen.getByLabelText('Sede'), 'ICV');
    await user.selectOptions(screen.getByLabelText('Profesional'), '12');
    await user.selectOptions(screen.getByLabelText('Especialidad'), '4');
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-31' } });

    await waitFor(() => {
      const last = calls.filter((c) => c.path === '/api/v1/admin/appointments/requests').at(-1);
      expect(last?.query.get('siteCode')).toBe('ICV');
      expect(last?.query.get('professionalId')).toBe('12');
      expect(last?.query.get('specialtyId')).toBe('4');
      expect(last?.query.get('from')).toBe('2026-10-01');
      expect(last?.query.get('to')).toBe('2026-10-31');
    });

    await user.click(screen.getByRole('tab', { name: /Reprogramaciones/ }));
    expect(await screen.findByText('No hay reprogramaciones pendientes')).toBeInTheDocument();
    const reschedules = calls.filter((c) => c.path === '/api/v1/admin/reschedule-requests').at(-1);
    expect(reschedules?.query.get('siteCode')).toBe('ICV');
    expect(reschedules?.query.get('to')).toBe('2026-10-31');

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => {
      const last = calls.filter((c) => c.path === '/api/v1/admin/reschedule-requests').at(-1);
      expect([...(last?.query.keys() ?? [])]).toHaveLength(0);
    });
  });

  it('HU-022 CA-02 un rango de fechas invertido se señala y no se consulta', async () => {
    const calls = mockApi({ ...OPTIONS, [REQUESTS]: { body: { items: [ANA] } } });
    renderWithProviders(<RequestsPage />);
    await screen.findByRole('table');
    const before = calls.filter((c) => c.path === '/api/v1/admin/appointments/requests').length;

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-20' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });

    expect(await screen.findByText('La fecha final debe ser igual o posterior a la inicial.')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('aria-invalid', 'true');
    expect(calls.filter((c) => c.path === '/api/v1/admin/appointments/requests').length).toBe(before + 1);
  });

  it('HU-019 CA-01 aprobar una reprogramación llama al endpoint, quita la fila y avisa', async () => {
    const calls = mockApi({
      ...OPTIONS,
      [REQUESTS]: { body: { items: [] } },
      [RESCHEDULES]: { body: { items: [REPROGRAMACION] } },
      'POST /api/v1/admin/reschedule-requests/7/approve': {
        body: { id: 7, appointmentId: 40, status: 'APPROVED', decisionReason: null },
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);
    await screen.findByText('No hay solicitudes pendientes');

    const table = await openReschedulesTab(user);
    const row = within(table).getByText('Carlos Rojas').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /^Aprobar reprogramación/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('¿Aprobar esta reprogramación?')).toBeInTheDocument();
    expect(within(dialog).getByText('06/10/2026 08:00 · HIC')).toBeInTheDocument();
    expect(within(dialog).getByText('09/10/2026 14:00 · ICV')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Aprobar reprogramación/ }));

    expect(await screen.findByText('Reprogramación aprobada. La cita quedó en el nuevo horario.')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/v1/admin/reschedule-requests/7/approve')).toBe(true);
    expect(await screen.findByText('No hay reprogramaciones pendientes')).toBeInTheDocument();
  });

  it('HU-019 CA-02/CA-03 rechazar exige motivo y lo envía recortado', async () => {
    const calls = mockApi({
      ...OPTIONS,
      [REQUESTS]: { body: { items: [] } },
      [RESCHEDULES]: { body: { items: [REPROGRAMACION] } },
      'POST /api/v1/admin/reschedule-requests/7/reject': {
        body: { id: 7, appointmentId: 40, status: 'REJECTED', decisionReason: 'Sin cupo' },
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);
    await screen.findByText('No hay solicitudes pendientes');

    const table = await openReschedulesTab(user);
    const row = within(table).getByText('Carlos Rojas').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /^Rechazar reprogramación/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar reprogramación/ }));
    expect(within(dialog).getByText('El motivo del rechazo es obligatorio')).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);

    await user.type(within(dialog).getByLabelText(/Motivo del rechazo/), '  Sin cupo  ');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar reprogramación/ }));

    expect(await screen.findByText('Reprogramación rechazada. La cita conserva su horario.')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ reason: 'Sin cupo' });
  });

  it('HU-019 CA-04 un 409 (ya resuelta o vencida) muestra el conflicto y permite actualizar', async () => {
    let listCalls = 0;
    mockApi({
      ...OPTIONS,
      [REQUESTS]: { body: { items: [] } },
      [RESCHEDULES]: () => ({ body: { items: ++listCalls === 1 ? [REPROGRAMACION] : [] } }),
      'POST /api/v1/admin/reschedule-requests/7/approve': problem(409, 'RESCHEDULE_EXPIRED'),
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);
    await screen.findByText('No hay solicitudes pendientes');

    const table = await openReschedulesTab(user);
    const row = within(table).getByText('Carlos Rojas').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /^Aprobar reprogramación/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Aprobar reprogramación/ }));

    expect(await within(dialog).findByText('Esta solicitud ya fue resuelta')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Actualizar lista/ }));
    expect(await screen.findByText('No hay reprogramaciones pendientes')).toBeInTheDocument();
  });

  it('las opciones de los filtros fallan en silencio sin bloquear la bandeja', async () => {
    mockApi({ [REQUESTS]: { body: { items: [ANA] } } });
    renderWithProviders(<RequestsPage />);

    expect(within(await screen.findByRole('table')).getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Todos los profesionales' })).toBeInTheDocument();
    expect(screen.queryByText('No pudimos conectar con el servidor. Inténtalo de nuevo.')).not.toBeInTheDocument();
  });
});
