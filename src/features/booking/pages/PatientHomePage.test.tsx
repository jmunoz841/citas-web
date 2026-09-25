import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientHomePage } from './PatientHomePage';
import { FakeResponse, mockApi, problem, RecordedCall, renderWithProviders, signIn, signOut } from '../../../test/apiTestUtils';
import type { AvailabilitySlot } from '../api/bookingApi';

const SESSION = { userId: 5, email: 'ana@example.test', firstNames: 'Ana', lastNames: 'Pérez', roles: ['USER'] };

const SITES = {
  items: [
    { code: 'HIC', name: 'Hospital Internacional de Colombia', address: 'Km 7 Autopista Bucaramanga–Piedecuesta, Valle de Menzulí, Santander' },
    { code: 'ICV', name: 'Instituto Cardiovascular', address: 'Calle 155A No. 23-58, Urbanización El Bosque, Floridablanca, Santander' },
  ],
};

const SPECIALTIES = {
  items: [
    { id: 4, name: 'Cardiología', durationMinutes: 60, type: 'SPECIALIZED' },
    { id: 1, name: 'Medicina General', durationMinutes: 30, type: 'GENERAL' },
  ],
};

const DAY = '2026-09-26';
const DAY_LABEL = 'sábado, 26 de septiembre de 2026';

const generalSlot = (startTime: string, endTime: string, overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot => ({
  professionalId: 20,
  professionalName: 'Carlos Morales',
  specialtyId: 1,
  specialtyName: 'Medicina General',
  type: 'GENERAL',
  durationMinutes: 30,
  siteCode: 'HIC',
  date: DAY,
  startTime,
  endTime,
  ...overrides,
});

const cardioSlot: AvailabilitySlot = {
  professionalId: 12,
  professionalName: 'Laura Gómez',
  specialtyId: 4,
  specialtyName: 'Cardiología',
  type: 'SPECIALIZED',
  durationMinutes: 60,
  siteCode: 'ICV',
  date: DAY,
  startTime: '09:00',
  endTime: '10:00',
};

type Routes = Parameters<typeof mockApi>[0];

function setup(extra: Routes = {}): RecordedCall[] {
  return mockApi({
    'GET /api/v1/auth/session': { body: SESSION },
    'GET /api/v1/catalogs/sites': { body: SITES },
    'GET /api/v1/catalogs/specialties': { body: SPECIALTIES },
    'GET /api/v1/availability': { body: { items: [generalSlot('08:00', '08:30'), generalSlot('08:30', '09:00')] } },
    ...extra,
  });
}

const availabilityCalls = (calls: RecordedCall[]) => calls.filter((c) => c.path === '/api/v1/availability');
const continueButton = () => screen.getByRole('button', { name: 'Continuar' });

async function openBooking(user: ReturnType<typeof userEvent.setup>) {
  renderWithProviders(<PatientHomePage />, { withSession: true });
  await screen.findByText('HIC — Hospital Internacional de Colombia');
  await user.click(screen.getByRole('button', { name: 'Agendar cita' }));
  return screen.getByRole('dialog', { name: 'Agendar cita' });
}

/** Paso 1 (Medicina General + sede) y paso 2 (26 de septiembre). */
async function reachSlots(user: ReturnType<typeof userEvent.setup>, site = 'HIC') {
  await openBooking(user);
  await user.click(screen.getByRole('radio', { name: /Medicina General/ }));
  await user.click(screen.getByRole('radio', { name: site }));
  await user.click(continueButton());
  await user.click(screen.getByRole('button', { name: DAY_LABEL }));
  await user.click(continueButton());
}

beforeEach(() => {
  // Solo se congela la fecha: los temporizadores reales siguen funcionando para user-event.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
  signIn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  signOut();
});

describe('Inicio del paciente', () => {
  it('saluda con los nombres de la sesión y muestra las dos sedes del catálogo', async () => {
    setup();
    renderWithProviders(<PatientHomePage />, { withSession: true });

    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeInTheDocument();
    expect(screen.getByText('Agenda una cita en HIC o ICV sin filas ni llamadas.')).toBeInTheDocument();
    expect(screen.getByText('Medicina General se confirma al instante. Las especialidades requieren aprobación.')).toBeInTheDocument();
    expect(await screen.findByText('HIC — Hospital Internacional de Colombia')).toBeInTheDocument();
    expect(screen.getByText('ICV — Instituto Cardiovascular')).toBeInTheDocument();
    expect(screen.getByText(SITES.items[1].address)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agendar cita' })).toBeInTheDocument();
  });
});

describe('Modal "Agendar cita"', () => {
  it('"Continuar" queda deshabilitado hasta que cada paso es válido', async () => {
    setup();
    const user = userEvent.setup();
    await openBooking(user);

    expect(screen.getByText('Paso 1 de 4, Tipo de cita')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeDisabled();
    expect(continueButton()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Medicina General/ }));
    expect(continueButton()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'HIC' }));
    expect(continueButton()).toBeEnabled();

    // Especialidad sin elegir: vuelve a bloquear.
    await user.click(screen.getByRole('radio', { name: /^Especialidad/ }));
    expect(continueButton()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /Medicina General/ }));
    await user.click(continueButton());

    expect(screen.getByText('Paso 2 de 4, Fecha y profesional')).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'jueves, 24 de septiembre de 2026' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: DAY_LABEL }));
    await user.click(continueButton());

    await screen.findByRole('button', { name: '08:00' });
    expect(continueButton()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '08:00' }));
    expect(screen.getByRole('button', { name: '08:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(continueButton()).toBeEnabled();
  });

  it('HU-012 CA-01 y HU-013 CA-01: Medicina General se reserva y queda confirmada', async () => {
    const calls = setup({
      'POST /api/v1/appointments': {
        status: 201,
        body: { id: 31, status: 'APPROVED', professionalId: 20, specialtyId: 1, siteCode: 'HIC', date: DAY, startTime: '08:30', endTime: '09:00', durationMinutes: 30 },
      },
    });
    const user = userEvent.setup();
    await reachSlots(user);

    await user.click(await screen.findByRole('button', { name: '08:30' }));
    await user.click(continueButton());

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Tu cita quedará confirmada de inmediato.')).toBeInTheDocument();
    expect(within(dialog).getByText('Sábado, 26 de septiembre de 2026')).toBeInTheDocument();
    expect(within(dialog).getByText('08:30 – 09:00')).toBeInTheDocument();
    expect(within(dialog).getByText('Carlos Morales')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));

    expect(await screen.findByText('¡Tu cita está confirmada!')).toBeInTheDocument();
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({ professionalId: 20, specialtyId: 1, siteCode: 'HIC', date: DAY, startTime: '08:30' });
    const query = availabilityCalls(calls).at(-1)!.query;
    expect(query.get('type')).toBe('GENERAL');
    expect(query.get('siteCode')).toBe('HIC');
    expect(query.get('date')).toBe(DAY);

    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('HU-014 CA-01: una especialidad se envía como solicitud con el profesional elegido', async () => {
    const calls = setup({
      'GET /api/v1/availability': { body: { items: [cardioSlot] } },
      'POST /api/v1/appointments': {
        status: 201,
        body: { id: 32, status: 'REQUESTED', professionalId: 12, specialtyId: 4, siteCode: 'ICV', date: DAY, startTime: '09:00', endTime: '10:00', durationMinutes: 60 },
      },
    });
    const user = userEvent.setup();
    await openBooking(user);

    await user.click(screen.getByRole('radio', { name: /^Especialidad/ }));
    const specialty = screen.getByRole('combobox', { name: /Especialidad/ });
    await waitFor(() => expect(specialty).toBeEnabled());
    await user.selectOptions(specialty, 'Cardiología · 60 min');
    await user.click(screen.getByRole('radio', { name: 'ICV' }));
    await user.click(continueButton());

    await user.click(screen.getByRole('button', { name: DAY_LABEL }));
    const professional = screen.getByRole('combobox', { name: /Profesional/ });
    await screen.findByRole('option', { name: 'Laura Gómez' });
    await user.selectOptions(professional, 'Laura Gómez');
    await user.click(continueButton());

    await user.click(await screen.findByRole('button', { name: '09:00 – 10:00' }));
    await user.click(continueButton());

    expect(screen.getByText('Enviaremos tu solicitud al administrador. El horario queda apartado mientras la revisa.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Solicitar cita' }));

    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.getByText('Un administrador revisará tu solicitud. El horario queda apartado para ti.')).toBeInTheDocument();
    const slotsQuery = availabilityCalls(calls).at(-1)!.query;
    expect(slotsQuery.get('specialtyId')).toBe('4');
    expect(slotsQuery.get('siteCode')).toBe('ICV');
    expect(slotsQuery.get('professionalId')).toBe('12');
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      professionalId: 12,
      specialtyId: 4,
      siteCode: 'ICV',
      date: DAY,
      startTime: '09:00',
    });
  });

  it('HU-012 CA-03: con sede "Cualquiera" la búsqueda omite siteCode', async () => {
    const calls = setup();
    const user = userEvent.setup();
    await reachSlots(user, 'Cualquiera');

    await screen.findByRole('button', { name: '08:00' });
    const queries = availabilityCalls(calls);
    expect(queries.length).toBeGreaterThan(0);
    for (const call of queries) {
      expect(call.query.has('siteCode')).toBe(false);
      expect(call.query.get('type')).toBe('GENERAL');
    }
  });

  it('HU-012: sin horarios muestra el estado vacío y "Cambiar fecha" vuelve al paso 2', async () => {
    setup({ 'GET /api/v1/availability': { body: { items: [] } } });
    const user = userEvent.setup();
    await reachSlots(user);

    expect(await screen.findByText('No hay horarios disponibles para este día.')).toBeInTheDocument();
    expect(screen.getByText('Prueba otra fecha u otra sede.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cambiar fecha' }));
    expect(screen.getByRole('heading', { name: 'Fecha y profesional' })).toBeInTheDocument();
  });

  it('HU-013 CA-03: un 409 SLOT_UNAVAILABLE vuelve al paso 3 con el aviso y sin ese horario', async () => {
    const calls = setup({ 'POST /api/v1/appointments': problem(409, 'SLOT_UNAVAILABLE', 'El horario ya no está disponible') });
    const user = userEvent.setup();
    await reachSlots(user);

    await user.click(await screen.findByRole('button', { name: '08:00' }));
    await user.click(continueButton());
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));

    expect(await screen.findByText('Ese horario acaba de ser reservado por otra persona. Elige otro.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '08:30' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '08:00' })).not.toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
    // Se recargó la lista tras el conflicto.
    expect(availabilityCalls(calls).length).toBeGreaterThanOrEqual(3);
  });

  it('HU-013: un 400 en startTime vuelve al paso 3 con "Ese horario ya pasó. Elige otro."', async () => {
    setup({
      'POST /api/v1/appointments': problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
        { field: 'startTime', message: 'No se puede reservar en el pasado' },
      ]),
    });
    const user = userEvent.setup();
    await reachSlots(user);

    await user.click(await screen.findByRole('button', { name: '08:00' }));
    await user.click(continueButton());
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));

    expect(await screen.findByText('Ese horario ya pasó. Elige otro.')).toBeInTheDocument();
    expect(screen.getByText('Paso 3 de 4, Horario')).toBeInTheDocument();
  });

  it('otro 400 muestra el mensaje de la API y un fallo de red el de conexión, sin cerrar sesión', async () => {
    let response: FakeResponse = problem(400, 'VALIDATION_ERROR', 'Datos inválidos', [
      { field: 'siteCode', message: 'El profesional no atiende en la sede' },
    ]);
    setup({ 'POST /api/v1/appointments': () => response });
    const user = userEvent.setup();
    await reachSlots(user);

    await user.click(await screen.findByRole('button', { name: '08:00' }));
    await user.click(continueButton());
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByText('El profesional no atiende en la sede')).toBeInTheDocument();

    response = { status: 503, body: {} };
    await user.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(await screen.findByText('No pudimos conectar con el servidor. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
