import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfessionalsPage } from './ProfessionalsPage';
import { FakeResponse, mockApi, problem, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';
import { resetCatalogsApi } from '../../catalogs/api/catalogsApi';

const SPECIALTIES = [
  { id: 1, name: 'Medicina General', durationMinutes: 30, general: true, active: true },
  { id: 2, name: 'Cardiología', durationMinutes: 60, general: false, active: true },
  { id: 3, name: 'Dermatología', durationMinutes: 30, general: false, active: true },
  { id: 4, name: 'Neumología', durationMinutes: 60, general: false, active: false },
];

const SITES = [
  { code: 'HIC', name: 'Hospital Internacional de Colombia', address: 'Km 7 Autopista Bucaramanga–Piedecuesta' },
  { code: 'ICV', name: 'Instituto Cardiovascular', address: 'Calle 155A No. 23-58' },
];

const LAURA = {
  id: 12,
  firstNames: 'Laura',
  lastNames: 'Gómez',
  email: 'laura.gomez@ejemplo.local',
  professionalCode: 'PRO-001',
  licenseNumber: 'MP-45821',
  active: true,
  specialties: [
    { specialtyId: 1, primary: false },
    { specialtyId: 2, primary: true },
  ],
  siteCodes: ['HIC'],
};

const ANDRES = {
  ...LAURA,
  id: 13,
  firstNames: 'Andrés',
  lastNames: 'Vargas',
  email: 'andres.vargas@ejemplo.local',
  professionalCode: 'PRO-002',
  licenseNumber: 'MP-39107',
  active: false,
  specialties: [{ specialtyId: 3, primary: true }],
  siteCodes: ['HIC', 'ICV'],
};

function baseRoutes(professionals = [LAURA, ANDRES]): Record<string, FakeResponse> {
  return {
    'GET /api/v1/admin/professionals': { body: { items: professionals } },
    'GET /api/v1/admin/specialties': { body: { items: SPECIALTIES } },
    'GET /api/v1/catalogs/sites': { body: { items: SITES } },
    'GET /api/v1/catalogs/document-types': { body: { items: [{ code: 'CC', name: 'Cédula de ciudadanía' }] } },
  };
}

beforeEach(() => {
  resetCatalogsApi();
  signIn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  signOut();
});

function rowOf(table: HTMLElement, text: string): HTMLElement {
  return within(table).getByText(text).closest('tr') as HTMLElement;
}

type User = ReturnType<typeof userEvent.setup>;

async function openCreateForm(user: User): Promise<HTMLElement> {
  await screen.findByRole('table');
  await user.click(screen.getByRole('button', { name: /Nuevo profesional/ }));
  const dialog = screen.getByRole('dialog');
  // Espera a que el catálogo de tipos de documento termine de cargar.
  await waitFor(() => expect(within(dialog).getByLabelText(/Tipo de documento/)).not.toBeDisabled());
  return dialog;
}

async function fillPersonalData(user: User, dialog: HTMLElement) {
  const d = within(dialog);
  await user.type(d.getByLabelText(/^Nombres/), 'Carlos');
  await user.type(d.getByLabelText(/^Apellidos/), 'Rivera');
  await user.type(d.getByLabelText(/Número de documento/), '1098765432');
  await user.type(d.getByLabelText(/Correo electrónico/), 'carlos@ejemplo.local');
  await user.type(d.getByLabelText(/Teléfono/), '3001234567');
  await user.type(d.getByLabelText(/Contraseña temporal/), 'Temporal123');
  await user.type(d.getByLabelText(/Código profesional/), 'PRO-003');
  await user.type(d.getByLabelText(/Matrícula/), 'MAT-003');
}

describe('ProfessionalsPage (HU-008, HU-009)', () => {
  it('HU-008 listado: muestra código, matrícula, especialidades con la principal, sedes, estado y total', async () => {
    mockApi(baseRoutes());

    renderWithProviders(<ProfessionalsPage />);

    const table = await screen.findByRole('table');
    const row = rowOf(table, 'Laura Gómez');
    expect(within(row).getByText('laura.gomez@ejemplo.local')).toBeInTheDocument();
    expect(within(row).getByText('PRO-001')).toBeInTheDocument();
    expect(within(row).getByText('MP-45821')).toBeInTheDocument();
    expect(within(row).getByText('Cardiología (principal)')).toBeInTheDocument();
    expect(within(row).getByText('Medicina General')).toBeInTheDocument();
    expect(within(row).getByText('HIC')).toBeInTheDocument();
    expect(within(row).getByText('Activo')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /Editar asignaciones/ })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /Desactivar/ })).toBeInTheDocument();
    expect(within(rowOf(table, 'Andrés Vargas')).getByText('Inactivo')).toBeInTheDocument();
    expect(within(rowOf(table, 'Andrés Vargas')).getByRole('button', { name: /^Activar/ })).toBeInTheDocument();
    expect(screen.getByText('2 profesionales')).toBeInTheDocument();
  });

  it('HU-008 CA-02 sin especialidad principal marcada muestra el error y no llama a la API', async () => {
    const calls = mockApi(baseRoutes());
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);

    const dialog = await openCreateForm(user);
    await fillPersonalData(user, dialog);
    const d = within(dialog);
    await user.click(d.getByRole('checkbox', { name: 'Cardiología' }));
    await user.click(d.getByRole('checkbox', { name: /^HIC/ }));
    await user.click(d.getByRole('button', { name: /Crear profesional/ }));

    expect(d.getByText('Marca exactamente una especialidad principal')).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  });

  it('HU-008 CA-02 el radio "Principal" solo se habilita en especialidades marcadas y solo ofrece las activas', async () => {
    mockApi(baseRoutes());
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);

    const dialog = await openCreateForm(user);
    const d = within(dialog);
    expect(d.queryByRole('checkbox', { name: /Neumología/ })).not.toBeInTheDocument();
    const primary = d.getByRole('radio', { name: /Principal \(Cardiología\)/ });
    expect(primary).toBeDisabled();
    await user.click(d.getByRole('checkbox', { name: 'Cardiología' }));
    expect(primary).toBeEnabled();
  });

  it('HU-008 CA-03 sin sedes muestra "Asigna al menos una sede"', async () => {
    const calls = mockApi(baseRoutes());
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);

    const dialog = await openCreateForm(user);
    await fillPersonalData(user, dialog);
    const d = within(dialog);
    await user.click(d.getByRole('checkbox', { name: 'Cardiología' }));
    await user.click(d.getByRole('radio', { name: /Principal \(Cardiología\)/ }));
    await user.click(d.getByRole('button', { name: /Crear profesional/ }));

    expect(d.getByText('Asigna al menos una sede')).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  });

  it('HU-008 CA-01 crear envía el cuerpo del contrato y añade el profesional a la tabla', async () => {
    const created = {
      id: 20,
      firstNames: 'Carlos',
      lastNames: 'Rivera',
      email: 'carlos@ejemplo.local',
      professionalCode: 'PRO-003',
      licenseNumber: 'MAT-003',
      active: true,
      specialties: [
        { specialtyId: 2, primary: true },
        { specialtyId: 1, primary: false },
      ],
      siteCodes: ['HIC', 'ICV'],
    };
    const calls = mockApi({ ...baseRoutes(), 'POST /api/v1/admin/professionals': { status: 201, body: created } });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);

    const dialog = await openCreateForm(user);
    await fillPersonalData(user, dialog);
    const d = within(dialog);
    await user.click(d.getByRole('checkbox', { name: 'Cardiología' }));
    await user.click(d.getByRole('checkbox', { name: 'Medicina General' }));
    await user.click(d.getByRole('radio', { name: /Principal \(Cardiología\)/ }));
    await user.click(d.getByRole('checkbox', { name: /^HIC/ }));
    await user.click(d.getByRole('checkbox', { name: /^ICV/ }));
    await user.click(d.getByRole('button', { name: /Crear profesional/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      firstNames: 'Carlos',
      lastNames: 'Rivera',
      documentType: 'CC',
      documentNumber: '1098765432',
      email: 'carlos@ejemplo.local',
      phone: '3001234567',
      temporaryPassword: 'Temporal123',
      professionalCode: 'PRO-003',
      licenseNumber: 'MAT-003',
      specialties: [
        { specialtyId: 2, primary: true },
        { specialtyId: 1, primary: false },
      ],
      siteCodes: ['HIC', 'ICV'],
    });
    expect(within(screen.getByRole('table')).getByText('Carlos Rivera')).toBeInTheDocument();
    expect(screen.getByText('3 profesionales')).toBeInTheDocument();
  });

  it('HU-008 CA-04 un código profesional repetido (409) se marca en su campo', async () => {
    mockApi({
      ...baseRoutes(),
      'POST /api/v1/admin/professionals': problem(409, 'PROFESSIONAL_CODE_ALREADY_REGISTERED', 'Código repetido'),
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);

    const dialog = await openCreateForm(user);
    await fillPersonalData(user, dialog);
    const d = within(dialog);
    await user.click(d.getByRole('checkbox', { name: 'Cardiología' }));
    await user.click(d.getByRole('radio', { name: /Principal \(Cardiología\)/ }));
    await user.click(d.getByRole('checkbox', { name: /^HIC/ }));
    await user.click(d.getByRole('button', { name: /Crear profesional/ }));

    expect(await d.findAllByText('El código profesional ya está registrado')).not.toHaveLength(0);
    expect(d.getByLabelText(/Código profesional/)).toHaveAttribute('aria-invalid', 'true');
    expect(d.getByText('Revisa los campos marcados:')).toBeInTheDocument();
  });

  it('HU-008 editar asignaciones envía solo PUT specialties cuando cambian las especialidades', async () => {
    const calls = mockApi({
      ...baseRoutes(),
      'PUT /api/v1/admin/professionals/12/specialties': {
        body: {
          ...LAURA,
          specialties: [
            { specialtyId: 1, primary: true },
            { specialtyId: 2, primary: false },
          ],
        },
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Laura Gómez')).getByRole('button', { name: /Editar asignaciones/ }));
    const drawer = screen.getByRole('dialog', { name: 'Editar asignaciones' });
    const d = within(drawer);
    expect(d.getByRole('checkbox', { name: 'Cardiología' })).toBeChecked();
    expect(d.getByRole('radio', { name: /Principal \(Cardiología\)/ })).toBeChecked();
    await user.click(d.getByRole('radio', { name: /Principal \(Medicina General\)/ }));
    await user.click(d.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const puts = calls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(1);
    expect(puts[0].path).toBe('/api/v1/admin/professionals/12/specialties');
    expect(puts[0].body).toEqual({
      specialties: [
        { specialtyId: 1, primary: true },
        { specialtyId: 2, primary: false },
      ],
    });
    expect(within(rowOf(table, 'Laura Gómez')).getByText('Medicina General (principal)')).toBeInTheDocument();
  });

  it('HU-008 editar asignaciones envía PUT sites cuando cambian las sedes', async () => {
    const calls = mockApi({
      ...baseRoutes(),
      'PUT /api/v1/admin/professionals/12/sites': { body: { ...LAURA, siteCodes: ['HIC', 'ICV'] } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Laura Gómez')).getByRole('button', { name: /Editar asignaciones/ }));
    const d = within(screen.getByRole('dialog', { name: 'Editar asignaciones' }));
    await user.click(d.getByRole('checkbox', { name: /^ICV/ }));
    await user.click(d.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const puts = calls.filter((c) => c.method === 'PUT');
    expect(puts.map((c) => c.path)).toEqual(['/api/v1/admin/professionals/12/sites']);
    expect(puts[0].body).toEqual({ siteCodes: ['HIC', 'ICV'] });
  });

  it('HU-008 un 500 al guardar asignaciones muestra el banner de conexión sin cerrar el cajón', async () => {
    mockApi({
      ...baseRoutes(),
      'PUT /api/v1/admin/professionals/12/specialties': { status: 500, body: {} },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Laura Gómez')).getByRole('button', { name: /Editar asignaciones/ }));
    const d = within(screen.getByRole('dialog', { name: 'Editar asignaciones' }));
    await user.click(d.getByRole('checkbox', { name: 'Medicina General' }));
    await user.click(d.getByRole('button', { name: /Guardar cambios/ }));

    expect(await d.findByText('No pudimos conectar con el servidor. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Editar asignaciones' })).toBeInTheDocument();
  });

  it('HU-009 CA-01 desactivar pide confirmación y envía PATCH active=false', async () => {
    const calls = mockApi({
      ...baseRoutes(),
      'PATCH /api/v1/admin/professionals/12/active': { body: { ...LAURA, active: false } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Laura Gómez')).getByRole('button', { name: /Desactivar/ }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'El profesional dejará de aparecer en la búsqueda de citas. Sus datos, asignaciones y citas existentes se conservan.',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Confirmar desactivación/ }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ active: false });
    expect(within(rowOf(table, 'Laura Gómez')).getByText('Inactivo')).toBeInTheDocument();
  });

  it('HU-009 CA-03 activar un profesional inactivo envía PATCH active=true', async () => {
    const calls = mockApi({
      ...baseRoutes(),
      'PATCH /api/v1/admin/professionals/13/active': { body: { ...ANDRES, active: true } },
    });
    const user = userEvent.setup();
    renderWithProviders(<ProfessionalsPage />);
    const table = await screen.findByRole('table');

    await user.click(within(rowOf(table, 'Andrés Vargas')).getByRole('button', { name: /^Activar/ }));

    expect(await within(rowOf(table, 'Andrés Vargas')).findByText('Activo')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ active: true });
  });
});
