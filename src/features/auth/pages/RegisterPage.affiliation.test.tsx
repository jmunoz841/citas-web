import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { resetAuthApi } from '../api/authApi';
import { AuthError } from '../api/types';
import { resetCatalogsApi } from '../../catalogs/api/catalogsApi';

/**
 * Afiliación opcional en el registro (HU-004). El cliente de autenticación se sustituye por un
 * doble para observar exactamente qué cuerpo se envía.
 */

const PLANES = [
  { id: 1, name: 'Plan Básico', epsId: 1, epsName: 'EPS Salud Sintética' },
  { id: 3, name: 'Plan Esencial', epsId: 2, epsName: 'EPS Vida Laboratorio' },
];

const REGIMENES = [
  { code: 'CONTRIBUTIVO', name: 'Contributivo' },
  { code: 'SUBSIDIADO', name: 'Subsidiado' },
];

const TIPOS_DOCUMENTO = [{ code: 'CC', name: 'Cédula de ciudadanía' }];

const registerMock = vi.fn();

vi.mock('../api/authApi', () => ({
  getAuthApi: () => ({ register: registerMock }),
  resetAuthApi: () => undefined,
}));

function stubCatalogs() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const body = url.includes('insurance-plans')
        ? { items: PLANES }
        : url.includes('regimes')
          ? { items: REGIMENES }
          : { items: TIPOS_DOCUMENTO };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }),
  );
}

async function rellenarDatosObligatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombres/), 'Ana');
  await user.type(screen.getByLabelText(/Apellidos/), 'Prueba');
  await user.type(screen.getByLabelText(/Número de documento/), '1098765432');
  await user.type(screen.getByLabelText(/Correo/), 'ana@test.local');
  await user.type(screen.getByLabelText(/Teléfono/), '3001234567');
  await user.type(screen.getByLabelText(/^Contraseña/), 'Segura123');
  await user.type(screen.getByLabelText(/Confirmar/), 'Segura123');
}

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  stubCatalogs();
  registerMock.mockReset();
  registerMock.mockResolvedValue({ id: 1, roles: ['USER'] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCatalogsApi();
  resetAuthApi();
});

describe('RegisterPage — afiliación opcional', () => {
  it('carga los planes activos desde la API y los muestra con su EPS', async () => {
    renderRegister();

    const selectPlan = await screen.findByLabelText(/Plan de EPS/);
    await waitFor(() => expect(selectPlan).toHaveDisplayValue('Sin afiliación'));
    expect(screen.getByRole('option', { name: 'EPS Salud Sintética — Plan Básico' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EPS Vida Laboratorio — Plan Esencial' })).toBeInTheDocument();
  });

  it('permite registrarse sin elegir plan y no envia campos de afiliacion', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    await rellenarDatosObligatorios(user);
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1));
    const enviado = registerMock.mock.calls[0][0] as Record<string, unknown>;
    expect(enviado).not.toHaveProperty('insurancePlanId');
    expect(enviado).not.toHaveProperty('regimeCode');
  });

  it('envia plan y regimen cuando el usuario los elige', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    await rellenarDatosObligatorios(user);
    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '3');
    await user.selectOptions(screen.getByLabelText(/Régimen/), 'SUBSIDIADO');
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1));
    const enviado = registerMock.mock.calls[0][0] as Record<string, unknown>;
    expect(enviado.insurancePlanId).toBe(3);
    expect(enviado.regimeCode).toBe('SUBSIDIADO');
  });

  it('el selector de regimen esta deshabilitado mientras no haya plan', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    expect(screen.getByLabelText(/Régimen/)).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '1');
    expect(screen.getByLabelText(/Régimen/)).toBeEnabled();
  });

  it('exige el regimen si se eligio plan y no llama a la API', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    await rellenarDatosObligatorios(user);
    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '1');
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    expect(await screen.findByText(/Selecciona el régimen/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor cuando el plan deja de estar disponible', async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue(
      new AuthError({
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Datos invalidos.',
        errors: [{ field: 'insurancePlanId', message: 'El plan seleccionado no está disponible' }],
      }),
    );
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    await rellenarDatosObligatorios(user);
    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '1');
    await user.selectOptions(screen.getByLabelText(/Régimen/), 'CONTRIBUTIVO');
    await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));

    expect(await screen.findByText(/no está disponible/i)).toBeInTheDocument();
  });

  it('al quitar el plan tambien se limpia el regimen', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByLabelText(/Plan de EPS/);

    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '1');
    await user.selectOptions(screen.getByLabelText(/Régimen/), 'CONTRIBUTIVO');
    await user.selectOptions(screen.getByLabelText(/Plan de EPS/), '');

    expect(screen.getByLabelText(/Régimen/)).toHaveValue('');
  });
});
