import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';
import { AgendaPage } from './AgendaPage';

const ME = '/api/v1/professional/me';
const BLOCKS = '/api/v1/professional/availability-blocks';

const profile = (overrides: Record<string, unknown> = {}) => ({
  body: {
    id: 12,
    firstNames: 'Laura',
    lastNames: 'Gómez',
    active: true,
    primarySpecialty: { id: 4, name: 'Cardiología', durationMinutes: 60 },
    sites: [
      { code: 'HIC', name: 'Hospital Internacional de Colombia' },
      { code: 'ICV', name: 'Instituto Cardiovascular' },
    ],
    ...overrides,
  },
});

// Semana del lunes 21 al sábado 26 de septiembre de 2026; "hoy" es el jueves 24 a las 09:00.
const WEEK_BLOCKS = [
  { id: 1, siteCode: 'HIC', date: '2026-09-21', startTime: '08:00', endTime: '12:00', slots: 8 },
  { id: 2, siteCode: 'ICV', date: '2026-09-23', startTime: '07:30', endTime: '10:30', slots: 6 },
  { id: 3, siteCode: 'HIC', date: '2026-09-25', startTime: '08:00', endTime: '10:00', slots: 4 },
  // Otra semana: no debe aparecer.
  { id: 4, siteCode: 'HIC', date: '2026-10-01', startTime: '08:00', endTime: '09:00', slots: 2 },
];

const LUNES = 'Lunes 21 de septiembre, 08:00 a 12:00, sede HIC, 8 espacios';
const MIERCOLES = 'Miércoles 23 de septiembre, 07:30 a 10:30, sede ICV, 6 espacios';
const VIERNES = 'Viernes 25 de septiembre, 08:00 a 10:00, sede HIC, 4 espacios';

function setup() {
  return userEvent.setup();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 9, 0));
  signIn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  signOut();
});

describe('Mi agenda (HU-010)', () => {
  it('CA-01: muestra los bloques de la semana con nombre accesible y "Sin horarios" en los días vacíos', async () => {
    mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });

    renderWithProviders(<AgendaPage />);

    expect(await screen.findByRole('button', { name: LUNES })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: MIERCOLES })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: VIERNES })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /1 de octubre/ })).not.toBeInTheDocument();
    expect(screen.getByText('21 – 26 sep 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Sin horarios')).toHaveLength(3);
    expect(within(screen.getByRole('group', { name: 'Martes 22 de septiembre' })).getByText('Sin horarios')).toBeInTheDocument();
    expect(screen.getByTestId('today-header')).toHaveTextContent('24 sep');
  });

  it('navega entre semanas y vuelve a hoy', async () => {
    const user = setup();
    mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(screen.getByText('28 sep – 3 oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jueves 1 de octubre, 08:00 a 09:00/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(screen.getByText('21 – 26 sep 2026')).toBeInTheDocument();
  });

  it('el filtro de sede solo ofrece las sedes asignadas y filtra los bloques', async () => {
    const user = setup();
    mockApi({
      [`GET ${ME}`]: profile({ sites: [{ code: 'HIC', name: 'Hospital Internacional de Colombia' }] }),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
    });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    const filter = screen.getByRole('radiogroup', { name: 'Filtrar por sede' });
    const options = within(filter).getAllByRole('radio');
    expect(options.map((o) => o.textContent)).toEqual(['Todas', 'HIC']);
    expect(within(filter).getByRole('radio', { name: 'Todas' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(filter).getByRole('radio', { name: 'HIC' }));

    expect(within(filter).getByRole('radio', { name: 'HIC' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('button', { name: MIERCOLES })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: LUNES })).toBeInTheDocument();
  });

  it('CA-02: publicar un bloque envía el cuerpo del contrato y lo muestra en el calendario', async () => {
    const user = setup();
    const calls = mockApi({
      [`GET ${ME}`]: profile(),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`POST ${BLOCKS}`]: ({ body }) => ({ status: 201, body: { id: 9, slots: 6, ...(body as object) } }),
    });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    await user.click(screen.getByRole('button', { name: 'Publicar bloque' }));
    const dialog = screen.getByRole('dialog', { name: 'Publicar bloque' });
    const date = within(dialog).getByLabelText(/Fecha/);
    expect(date).toHaveValue('2026-09-24');
    expect(date).toHaveAttribute('min', '2026-09-24');

    await user.clear(date);
    await user.type(date, '2026-09-26');
    await user.selectOptions(within(dialog).getByLabelText(/Hora de inicio/), '14:00');
    await user.selectOptions(within(dialog).getByLabelText(/Hora de fin/), '17:00');
    expect(within(dialog).getByText('Se crearán 6 espacios de 30 minutos')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: /ICV/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Publicar bloque' }));

    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({ date: '2026-09-26', startTime: '14:00', endTime: '17:00', siteCode: 'ICV' });
    expect(await screen.findByRole('button', { name: 'Sábado 26 de septiembre, 14:00 a 17:00, sede ICV, 6 espacios' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Bloque publicado.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('valida en el cliente que la hora de fin sea posterior y que no esté en el pasado', async () => {
    const user = setup();
    const calls = mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    await user.click(screen.getByRole('button', { name: 'Publicar bloque' }));
    const dialog = screen.getByRole('dialog', { name: 'Publicar bloque' });
    await user.selectOptions(within(dialog).getByLabelText(/Hora de inicio/), '08:00');
    await user.selectOptions(within(dialog).getByLabelText(/Hora de fin/), '08:00');
    await user.click(within(dialog).getByRole('radio', { name: /HIC/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Publicar bloque' }));

    expect(within(dialog).getByText('La hora de fin debe ser posterior a la de inicio')).toBeInTheDocument();
    expect(within(dialog).getByText('No se puede publicar disponibilidad en el pasado')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Hora de inicio/)).toHaveAttribute('aria-invalid', 'true');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('CA-03: el solapamiento que responde el servidor aparece en "Hora de inicio"', async () => {
    const user = setup();
    mockApi({
      [`GET ${ME}`]: profile({ sites: [{ code: 'HIC', name: 'Hospital Internacional de Colombia' }] }),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`POST ${BLOCKS}`]: problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'startTime', message: 'El bloque se cruza con otro que ya publicaste' },
      ]),
    });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    await user.click(screen.getByRole('button', { name: 'Publicar bloque' }));
    const dialog = screen.getByRole('dialog', { name: 'Publicar bloque' });
    // Con una sola sede asignada queda preseleccionada.
    expect(within(dialog).getByRole('radio', { name: /HIC/ })).toBeChecked();
    await user.selectOptions(within(dialog).getByLabelText(/Hora de inicio/), '10:00');
    await user.selectOptions(within(dialog).getByLabelText(/Hora de fin/), '12:00');
    await user.click(within(dialog).getByRole('button', { name: 'Publicar bloque' }));

    const start = await within(dialog).findByLabelText(/Hora de inicio/);
    await waitFor(() => expect(start).toHaveAttribute('aria-invalid', 'true'));
    expect(start).toHaveAccessibleDescription('El bloque se cruza con otro que ya publicaste');
  });

  it('CA-05: si el bloque tiene citas, eliminar muestra la advertencia y lo conserva', async () => {
    const user = setup();
    mockApi({
      [`GET ${ME}`]: profile(),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`DELETE ${BLOCKS}/3`]: problem(409, 'BLOCK_HAS_APPOINTMENTS', 'El bloque tiene citas'),
    });
    renderWithProviders(<AgendaPage />);

    await user.click(await screen.findByRole('button', { name: VIERNES }));
    const details = screen.getByRole('dialog', { name: '08:00 – 10:00' });
    await user.click(within(details).getByRole('button', { name: 'Eliminar' }));

    const confirm = screen.getByRole('dialog', { name: '¿Eliminar este bloque?' });
    expect(confirm).toHaveAccessibleDescription('Se eliminarán sus 4 espacios.');
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar bloque' }));

    expect(
      await within(confirm).findByText('Este bloque tiene citas reservadas o solicitadas y no se puede modificar.'),
    ).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: VIERNES })).toBeInTheDocument();
  });

  it('CA-05: editar un bloque con citas muestra la advertencia de conflicto', async () => {
    const user = setup();
    const calls = mockApi({
      [`GET ${ME}`]: profile(),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`PATCH ${BLOCKS}/3`]: problem(409, 'BLOCK_HAS_APPOINTMENTS', 'El bloque tiene citas'),
    });
    renderWithProviders(<AgendaPage />);

    await user.click(await screen.findByRole('button', { name: VIERNES }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Editar' }));
    const form = screen.getByRole('dialog', { name: 'Editar bloque' });
    expect(within(form).getByLabelText(/Fecha/)).toHaveValue('2026-09-25');
    await user.selectOptions(within(form).getByLabelText(/Hora de fin/), '11:00');
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }));

    expect(await within(form).findByText('Este bloque tiene citas reservadas o solicitadas y no se puede modificar.')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ date: '2026-09-25', startTime: '08:00', endTime: '11:00', siteCode: 'HIC' });
  });

  it('eliminar un bloque sin citas lo quita del calendario', async () => {
    const user = setup();
    mockApi({
      [`GET ${ME}`]: profile(),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`DELETE ${BLOCKS}/3`]: { status: 204 },
    });
    renderWithProviders(<AgendaPage />);

    await user.click(await screen.findByRole('button', { name: VIERNES }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar bloque' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: VIERNES })).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('Bloque eliminado.');
  });

  it('un bloque pasado no ofrece acciones', async () => {
    const user = setup();
    mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });
    renderWithProviders(<AgendaPage />);

    await user.click(await screen.findByRole('button', { name: LUNES }));
    const details = screen.getByRole('dialog', { name: '08:00 – 12:00' });
    expect(within(details).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('cuenta inactiva: muestra el aviso y deshabilita "Publicar bloque"', async () => {
    mockApi({ [`GET ${ME}`]: profile({ active: false }), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });
    renderWithProviders(<AgendaPage />);

    expect(await screen.findByText('Tu cuenta profesional está inactiva')).toBeInTheDocument();
    expect(screen.getByText('No puedes publicar nuevos horarios.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar bloque' })).toBeDisabled();
  });

  it('cuenta inactiva detectada por el servidor (field professional) muestra el aviso', async () => {
    const user = setup();
    mockApi({
      [`GET ${ME}`]: profile(),
      [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } },
      [`POST ${BLOCKS}`]: problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'professional', message: 'Tu cuenta profesional está inactiva' },
      ]),
    });
    renderWithProviders(<AgendaPage />);
    await screen.findByRole('button', { name: LUNES });

    await user.click(screen.getByRole('button', { name: 'Publicar bloque' }));
    const dialog = screen.getByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText(/Hora de inicio/), '10:00');
    await user.click(within(dialog).getByRole('radio', { name: /HIC/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Publicar bloque' }));

    expect(await screen.findByText('No puedes publicar nuevos horarios.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar bloque' })).toBeDisabled();
  });

  it('semana sin bloques muestra el estado vacío', async () => {
    mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: [] } } });
    renderWithProviders(<AgendaPage />);

    expect(await screen.findByText('Aún no publicas horarios esta semana')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Publicar bloque' })).toHaveLength(2);
  });

  it('sin conexión muestra el banner con "Reintentar" y no cierra la sesión', async () => {
    const user = setup();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    renderWithProviders(<AgendaPage />);

    expect(await screen.findByText('No pudimos conectar con el servidor. Inténtalo de nuevo.')).toBeInTheDocument();

    mockApi({ [`GET ${ME}`]: profile(), [`GET ${BLOCKS}`]: { body: { items: WEEK_BLOCKS } } });
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: LUNES })).toBeInTheDocument();
  });
});
