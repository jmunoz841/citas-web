import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestsPage } from './RequestsPage';
import { mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const LIST = 'GET /api/v1/admin/appointments/requests';

const ANA = {
  id: 31,
  status: 'REQUESTED',
  patientName: 'Ana Pérez',
  professionalName: 'Laura Gómez',
  specialtyName: 'Cardiología',
  siteCode: 'HIC',
  date: '2026-09-26',
  startTime: '09:00',
  endTime: '10:00',
  durationMinutes: 60,
};

const CARLOS = {
  ...ANA,
  id: 32,
  patientName: 'Carlos Rojas',
  professionalName: 'Andrés Vargas',
  specialtyName: 'Dermatología',
  siteCode: 'ICV',
  startTime: '14:30',
  endTime: '15:00',
  durationMinutes: 30,
};

beforeEach(() => signIn());

afterEach(() => {
  vi.unstubAllGlobals();
  signOut();
});

async function table() {
  return screen.findByRole('table');
}

async function openDialog(user: ReturnType<typeof userEvent.setup>, action: 'Aprobar' | 'Rechazar', patient = 'Ana Pérez') {
  const t = await table();
  const row = within(t).getByText(patient).closest('tr') as HTMLElement;
  await user.click(within(row).getByRole('button', { name: new RegExp(`^${action}`) }));
  return screen.getByRole('dialog');
}

describe('RequestsPage (HU-015)', () => {
  it('HU-015 listado: muestra las solicitudes pendientes con fecha, hora y duración', async () => {
    mockApi({ [LIST]: { body: { items: [ANA, CARLOS] } } });

    renderWithProviders(<RequestsPage />);

    const t = await table();
    expect(within(t).getAllByRole('row')).toHaveLength(3);
    const row = within(t).getByText('Ana Pérez').closest('tr') as HTMLElement;
    expect(within(row).getByText('Cardiología')).toBeInTheDocument();
    expect(within(row).getByText('Laura Gómez')).toBeInTheDocument();
    expect(within(row).getByText('HIC')).toBeInTheDocument();
    expect(within(row).getByText('26/09/2026')).toBeInTheDocument();
    expect(within(row).getByText('09:00 – 10:00')).toBeInTheDocument();
    expect(within(row).getByText('60 min')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^Aprobar/ })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^Rechazar/ })).toBeInTheDocument();
  });

  it('HU-015 listado: muestra el estado vacío cuando no hay solicitudes', async () => {
    mockApi({ [LIST]: { body: { items: [] } } });

    renderWithProviders(<RequestsPage />);

    expect(await screen.findByText('No hay solicitudes pendientes')).toBeInTheDocument();
    expect(screen.getByText('Cuando un paciente solicite una cita especializada aparecerá aquí.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('HU-015 listado: un fallo de red muestra el banner de conexión y "Reintentar" vuelve a cargar', async () => {
    let attempts = 0;
    mockApi({ [LIST]: () => (++attempts === 1 ? problem(503, 'SERVER_ERROR') : { body: { items: [ANA] } }) });
    const user = userEvent.setup();

    renderWithProviders(<RequestsPage />);

    expect(await screen.findByText('No pudimos conectar con el servidor. Inténtalo de nuevo.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await table()).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('HU-015 CA-01 aprobar llama al endpoint, quita la fila y muestra el aviso', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [ANA, CARLOS] } },
      'POST /api/v1/admin/appointments/31/approve': { body: { id: 31, status: 'APPROVED' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Aprobar');
    expect(within(dialog).getByText('¿Aprobar esta cita?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Aprobar cita/ }));

    expect(await screen.findByText('Cita aprobada. El horario queda confirmado para el paciente.')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/v1/admin/appointments/31/approve')).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(await table()).queryByText('Ana Pérez')).not.toBeInTheDocument();
    expect(within(await table()).getByText('Carlos Rojas')).toBeInTheDocument();
  });

  it('HU-015 CA-03 rechazar sin motivo muestra el error y no llama a la API', async () => {
    const calls = mockApi({ [LIST]: { body: { items: [ANA] } } });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Rechazar');
    expect(within(dialog).getByText('El motivo queda registrado en el historial de la cita.')).toBeInTheDocument();
    const textarea = within(dialog).getByLabelText(/Motivo del rechazo/);
    await user.type(textarea, '   ');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar solicitud/ }));

    expect(within(dialog).getByText('El motivo del rechazo es obligatorio')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveFocus();
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  });

  it('HU-015 CA-02 el contador refleja el motivo y el campo limita a 500 caracteres', async () => {
    mockApi({ [LIST]: { body: { items: [ANA] } } });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Rechazar');
    const textarea = within(dialog).getByLabelText(/Motivo del rechazo/);
    expect(within(dialog).getByText('0/500')).toBeInTheDocument();
    await user.type(textarea, 'Hola');
    expect(within(dialog).getByText('4/500')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('HU-015 CA-02 rechazar envía el motivo recortado, quita la fila y muestra el aviso', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [ANA] } },
      'POST /api/v1/admin/appointments/31/reject': { body: { id: 31, status: 'REJECTED' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Rechazar');
    await user.type(within(dialog).getByLabelText(/Motivo del rechazo/), '  El especialista no atiende esta patología  ');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar solicitud/ }));

    expect(await screen.findByText('Solicitud rechazada. Los horarios quedaron libres.')).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.path).toBe('/api/v1/admin/appointments/31/reject');
    expect(post?.body).toEqual({ reason: 'El especialista no atiende esta patología' });
    expect(await screen.findByText('No hay solicitudes pendientes')).toBeInTheDocument();
  });

  it('HU-015 CA-03 un VALIDATION_ERROR del servidor en reason se muestra en el campo', async () => {
    mockApi({
      [LIST]: { body: { items: [ANA] } },
      'POST /api/v1/admin/appointments/31/reject': problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'reason', message: 'El motivo no puede superar 500 caracteres' },
      ]),
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Rechazar');
    const textarea = within(dialog).getByLabelText(/Motivo del rechazo/);
    await user.type(textarea, 'Motivo');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar solicitud/ }));

    expect(await within(dialog).findByText('El motivo no puede superar 500 caracteres')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('HU-015 CA-04 un 409 muestra "Esta solicitud ya fue resuelta" y permite actualizar la lista', async () => {
    let listCalls = 0;
    mockApi({
      [LIST]: () => ({ body: { items: ++listCalls === 1 ? [ANA] : [] } }),
      'POST /api/v1/admin/appointments/31/approve': problem(409, 'INVALID_STATUS_TRANSITION', 'La cita no está pendiente'),
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Aprobar');
    await user.click(within(dialog).getByRole('button', { name: /Aprobar cita/ }));

    expect(await within(dialog).findByText('Esta solicitud ya fue resuelta')).toBeInTheDocument();
    expect(within(dialog).getByText('La cita ya no está pendiente de aprobación. Actualiza la lista.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Actualizar lista/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('No hay solicitudes pendientes')).toBeInTheDocument();
  });

  it('HU-015 CA-04 un 409 al rechazar también muestra la alerta de conflicto', async () => {
    mockApi({
      [LIST]: { body: { items: [ANA] } },
      'POST /api/v1/admin/appointments/31/reject': problem(409, 'INVALID_STATUS_TRANSITION'),
    });
    const user = userEvent.setup();
    renderWithProviders(<RequestsPage />);

    const dialog = await openDialog(user, 'Rechazar');
    await user.type(within(dialog).getByLabelText(/Motivo del rechazo/), 'Motivo');
    await user.click(within(dialog).getByRole('button', { name: /Rechazar solicitud/ }));

    expect(await within(dialog).findByText('Esta solicitud ya fue resuelta')).toBeInTheDocument();
  });
});
