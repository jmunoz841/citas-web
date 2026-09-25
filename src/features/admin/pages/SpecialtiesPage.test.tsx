import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpecialtiesPage } from './SpecialtiesPage';
import { mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';

const LIST = 'GET /api/v1/admin/specialties';

const GENERAL = { id: 1, name: 'Medicina General', durationMinutes: 30, general: true, active: true };
const CARDIO = { id: 2, name: 'Cardiología', durationMinutes: 60, general: false, active: true };
const NEUMO = { id: 4, name: 'Neumología', durationMinutes: 60, general: false, active: false };

beforeEach(() => signIn());

afterEach(() => {
  vi.unstubAllGlobals();
  signOut();
});

function rowOf(table: HTMLElement, name: string): HTMLElement {
  return within(table).getByText(name).closest('tr') as HTMLElement;
}

describe('SpecialtiesPage (HU-006)', () => {
  it('HU-006 listado: muestra duración, tipo General solo en Medicina General, estado y la nota de trazabilidad', async () => {
    mockApi({ [LIST]: { body: { items: [GENERAL, CARDIO, NEUMO] } } });

    renderWithProviders(<SpecialtiesPage />);

    const table = await screen.findByRole('table');
    expect(within(rowOf(table, 'Medicina General')).getByText('General')).toBeInTheDocument();
    expect(within(rowOf(table, 'Cardiología')).queryByText('General')).not.toBeInTheDocument();
    expect(within(rowOf(table, 'Cardiología')).getByText('60 min')).toBeInTheDocument();
    expect(within(rowOf(table, 'Cardiología')).getByText('Activa')).toBeInTheDocument();
    expect(within(rowOf(table, 'Neumología')).getByText('Inactiva')).toBeInTheDocument();
    expect(within(rowOf(table, 'Neumología')).getByRole('button', { name: /Activar Neumología/ })).toBeInTheDocument();
    expect(
      screen.getByText('Las especialidades no pueden eliminarse para garantizar la trazabilidad del historial clínico.'),
    ).toBeInTheDocument();
  });

  it('HU-006 CA-01 crear envía nombre y duración y añade la fila', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [GENERAL] } },
      'POST /api/v1/admin/specialties': { status: 201, body: { id: 9, name: 'Dermatología', durationMinutes: 60, general: false, active: true } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Nueva especialidad/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('La agenda se organiza en bloques de 30 minutos')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Nombre/), '  Dermatología ');
    await user.click(within(dialog).getByRole('radio', { name: /60 min/ }));
    await user.click(within(dialog).getByRole('button', { name: /Crear especialidad/ }));

    expect(await within(await screen.findByRole('table')).findByText('Dermatología')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ name: 'Dermatología', durationMinutes: 60 });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('HU-006 CA-01 un nombre repetido (409) se marca en el campo Nombre', async () => {
    mockApi({
      [LIST]: { body: { items: [GENERAL, CARDIO] } },
      'POST /api/v1/admin/specialties': problem(409, 'SPECIALTY_NAME_ALREADY_REGISTERED', 'Nombre repetido'),
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Nueva especialidad/ }));
    const dialog = screen.getByRole('dialog');
    const name = within(dialog).getByLabelText(/Nombre/);
    await user.type(name, 'Cardiología');
    await user.click(within(dialog).getByRole('button', { name: /Crear especialidad/ }));

    expect(await within(dialog).findByText('Ya existe una especialidad con ese nombre')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('HU-006 CA-02 un error de duración del servidor se muestra en el control de duración', async () => {
    mockApi({
      [LIST]: { body: { items: [GENERAL] } },
      'POST /api/v1/admin/specialties': problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'durationMinutes', message: 'La duración debe ser 30 o 60 minutos' },
      ]),
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Nueva especialidad/ }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Nombre/), 'Pediatría');
    await user.click(within(dialog).getByRole('button', { name: /Crear especialidad/ }));

    expect(await within(dialog).findByText('La duración debe ser 30 o 60 minutos')).toBeInTheDocument();
  });

  it('HU-006 editar envía PATCH con los cambios', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [CARDIO] } },
      'PATCH /api/v1/admin/specialties/2': { body: { ...CARDIO, durationMinutes: 30 } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Cardiología')).getByRole('button', { name: /Editar Cardiología/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText(/Nombre/)).toHaveValue('Cardiología');
    await user.click(within(dialog).getByRole('radio', { name: /30 min/ }));
    await user.click(within(dialog).getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ name: 'Cardiología', durationMinutes: 30 });
    expect(within(rowOf(table, 'Cardiología')).getByText('30 min')).toBeInTheDocument();
  });

  it('HU-006 CA-04 desactivar pide confirmación y envía PATCH active=false', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [CARDIO] } },
      'PATCH /api/v1/admin/specialties/2/active': { body: { ...CARDIO, active: false } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Cardiología')).getByRole('button', { name: /Desactivar Cardiología/ }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Los pacientes dejarán de verla al buscar citas. Las citas existentes se conservan.'),
    ).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);

    await user.click(within(dialog).getByRole('button', { name: /Desactivar especialidad/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const patch = calls.find((c) => c.method === 'PATCH');
    expect(patch?.path).toBe('/api/v1/admin/specialties/2/active');
    expect(patch?.body).toEqual({ active: false });
    expect(within(rowOf(table, 'Cardiología')).getByText('Inactiva')).toBeInTheDocument();
  });

  it('HU-006 activar una especialidad inactiva envía PATCH active=true', async () => {
    const calls = mockApi({
      [LIST]: { body: { items: [NEUMO] } },
      'PATCH /api/v1/admin/specialties/4/active': { body: { ...NEUMO, active: true } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SpecialtiesPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Neumología')).getByRole('button', { name: /Activar Neumología/ }));

    expect(await within(rowOf(table, 'Neumología')).findByText('Activa')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ active: true });
  });
});
