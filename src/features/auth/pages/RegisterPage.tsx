import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthApi } from '../api/authApi';
import { useDocumentTypes } from '../../catalogs/hooks/useDocumentTypes';
import { useAffiliationCatalogs } from '../../catalogs/hooks/useAffiliationCatalogs';
import { AuthError } from '../api/types';
import {
  evaluatePasswordCriteria,
  RegisterFormErrors,
  RegisterFormValues,
  validateRegisterField,
  validateRegisterForm,
} from '../validation/validation';
import { AuthLayout } from '../components/AuthLayout';
import { Card } from '../components/Card';
import { FormGroup } from '../components/FormGroup';
import { TextField } from '../../../shared/components/TextField';
import { PasswordField } from '../components/PasswordField';
import { SelectField, SelectOption } from '../../../shared/components/SelectField';
import { PasswordChecklist } from '../components/PasswordChecklist';
import { Button } from '../../../shared/components/Button';
import { ErrorSummary, ErrorSummaryItem } from '../components/ErrorSummary';
import { SuccessState } from '../components/SuccessState';
import { AlertBanner } from '../../../shared/components/AlertBanner';

// Opción visible mientras el catálogo viaja por la red, para que el select nunca quede vacío.
const LOADING_DOCUMENT_TYPE: SelectOption[] = [{ value: '', label: 'Cargando…' }];

// Orden de los campos en el formulario, id del control y etiqueta para el resumen de errores.
const FIELD_ORDER: (keyof RegisterFormValues)[] = [
  'firstNames',
  'lastNames',
  'documentType',
  'documentNumber',
  'email',
  'phone',
  'password',
  'confirmPassword',
];

const FIELD_IDS: Record<keyof RegisterFormValues, string> = {
  firstNames: 'input-nombres',
  lastNames: 'input-apellidos',
  documentType: 'select-tipo-doc',
  documentNumber: 'input-num-doc',
  email: 'input-correo',
  phone: 'input-telefono',
  password: 'input-password',
  confirmPassword: 'input-confirm-password',
};

const FIELD_LABELS: Record<keyof RegisterFormValues, string> = {
  firstNames: 'Nombres',
  lastNames: 'Apellidos',
  documentType: 'Tipo de documento',
  documentNumber: 'Número de documento',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  password: 'Contraseña',
  confirmPassword: 'Confirmar contraseña',
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const documentTypes = useDocumentTypes();
  const affiliationCatalogs = useAffiliationCatalogs();

  // La afiliación es opcional y vive fuera de `values`: no la valida el validador del formulario.
  const [affiliation, setAffiliation] = useState({ insurancePlanId: '', regimeCode: '' });
  const [affiliationError, setAffiliationError] = useState<string | null>(null);

  const [values, setValues] = useState<RegisterFormValues>({
    firstNames: '',
    lastNames: '',
    documentType: 'CC',
    documentNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [conflictSummaryItems, setConflictSummaryItems] = useState<ErrorSummaryItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const serverBannerRef = useRef<HTMLDivElement>(null);

  const passwordCriteria = evaluatePasswordCriteria(values.password);

  const handleFieldChange = (field: keyof RegisterFormValues, val: string) => {
    const updated = { ...values, [field]: val };
    setValues(updated);

    if (hasSubmitted) {
      const err = validateRegisterField(field, updated);
      setErrors((prev) => ({
        ...prev,
        [field]: err,
      }));
    }

    // Al editar un campo señalado por la API, se retira del resumen.
    if (conflictSummaryItems.length > 0) {
      setConflictSummaryItems((prev) => prev.filter((item) => item.fieldId !== FIELD_IDS[field]));
    }
  };

  const handleFieldBlur = (field: keyof RegisterFormValues) => {
    if (hasSubmitted) {
      const err = validateRegisterField(field, values);
      setErrors((prev) => ({
        ...prev,
        [field]: err,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setConflictSummaryItems([]);
    setServerError(null);

    const formErrors = validateRegisterForm(values);
    setErrors(formErrors);

    // Espejo de la regla del servidor: plan y régimen van en pareja (HU-004, CA-06).
    const faltaRegimen = affiliation.insurancePlanId !== '' && affiliation.regimeCode === '';
    setAffiliationError(faltaRegimen ? 'Selecciona el régimen de tu afiliación.' : null);
    if (faltaRegimen) {
      document.getElementById('select-regimen')?.focus();
      return;
    }

    if (Object.keys(formErrors).length > 0) {
      // Lleva el foco al primer campo con error.
      const firstErrorField = FIELD_ORDER.find((f) => formErrors[f]);
      if (firstErrorField) {
        document.getElementById(FIELD_IDS[firstErrorField])?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const api = getAuthApi();
      await api.register({
        firstNames: values.firstNames,
        lastNames: values.lastNames,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        email: values.email,
        phone: values.phone,
        password: values.password,
        // Solo viajan si el usuario eligió afiliación; si no, el registro va sin ella.
        ...(affiliation.insurancePlanId !== ''
          ? {
              insurancePlanId: Number(affiliation.insurancePlanId),
              regimeCode: affiliation.regimeCode,
            }
          : {}),
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      if (!(err instanceof AuthError) || err.code === 'NETWORK_ERROR' || err.status >= 500) {
        setServerError('No pudimos conectar con el servidor. Inténtalo de nuevo.');
        setTimeout(() => serverBannerRef.current?.focus(), 50);
      } else {
        // Errores por campo devueltos por la API (400 VALIDATION_ERROR o 409 de unicidad).
        const isConflict =
          err.code === 'EMAIL_ALREADY_REGISTERED' || err.code === 'DOCUMENT_ALREADY_REGISTERED';
        const newErrors: RegisterFormErrors = { ...errors };
        const summaryItems: ErrorSummaryItem[] = [];

        // Los campos de afiliación no están en el formulario principal: se muestran en su select.
        const affiliationMessage = err.fieldErrors.insurancePlanId ?? err.fieldErrors.regimeCode;
        if (affiliationMessage) {
          setAffiliationError(affiliationMessage);
        }

        for (const [key, msg] of Object.entries(err.fieldErrors)) {
          if (!(key in FIELD_IDS)) continue;
          const field = key as keyof RegisterFormValues;
          newErrors[field] = msg;
          summaryItems.push({
            fieldId: FIELD_IDS[field],
            label: FIELD_LABELS[field],
            reason: isConflict ? 'ya registrado' : undefined,
          });
        }

        setErrors(newErrors);
        setConflictSummaryItems(summaryItems);

        // Move focus to error summary card
        setTimeout(() => {
          if (errorSummaryRef.current) {
            errorSummaryRef.current.focus();
            errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout cardMaxWidth="640px">
      {/* 409 Conflict Top Error Summary */}
      {conflictSummaryItems.length > 0 && (
        <ErrorSummary
          ref={errorSummaryRef}
          items={conflictSummaryItems}
          onItemClick={(fieldId) => {
            const el = document.getElementById(fieldId);
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          title="Revisa los campos marcados:"
        />
      )}

      <Card id="signup-card">
        {isSuccess ? (
          <SuccessState onGoToLogin={() => navigate('/login')} />
        ) : (
          <>
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em]">
                Crea tu cuenta
              </h1>
              <p className="text-base text-[#5B6573] font-normal mt-1">
                Tus datos se usan solo para agendar tus citas.
              </p>
            </header>

            {serverError && (
              <AlertBanner
                ref={serverBannerRef}
                className="mb-6"
                description={serverError}
                title="Error de conexión"
              />
            )}

            {/* Registration Form */}
            <form
              className="flex flex-col gap-6"
              id="signup-form"
              noValidate
              onSubmit={handleSubmit}
            >
              {/* Fieldset 1: DATOS PERSONALES */}
              <FormGroup icon="person" legend="Datos personales">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    autoComplete="given-name"
                    errorText={errors.firstNames}
                    helperText="Tal como figura en tu identificación"
                    id="input-nombres"
                    isRequired
                    label="Nombres"
                    name="firstNames"
                    onBlur={() => handleFieldBlur('firstNames')}
                    onChange={(e) => handleFieldChange('firstNames', e.target.value)}
                    placeholder="Ej. María Fernanda"
                    value={values.firstNames}
                  />

                  <TextField
                    autoComplete="family-name"
                    errorText={errors.lastNames}
                    helperText="Primer y segundo apellido"
                    id="input-apellidos"
                    isRequired
                    label="Apellidos"
                    name="lastNames"
                    onBlur={() => handleFieldBlur('lastNames')}
                    onChange={(e) => handleFieldChange('lastNames', e.target.value)}
                    placeholder="Ej. Rodríguez Gómez"
                    value={values.lastNames}
                  />
                </div>
              </FormGroup>

              {/* Fieldset 2: DOCUMENTO DE IDENTIDAD */}
              <FormGroup icon="badge" legend="Documento de identidad">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    disabled={documentTypes.loading || documentTypes.failed}
                    errorText={
                      errors.documentType ||
                      (documentTypes.failed ? 'No pudimos cargar los tipos de documento.' : undefined)
                    }
                    helperText="Válido ante el sistema de salud en Colombia"
                    id="select-tipo-doc"
                    isRequired
                    label="Tipo de documento"
                    name="documentType"
                    onBlur={() => handleFieldBlur('documentType')}
                    onChange={(e) => handleFieldChange('documentType', e.target.value)}
                    options={documentTypes.loading ? LOADING_DOCUMENT_TYPE : documentTypes.options}
                    value={values.documentType}
                  />

                  <TextField
                    errorText={errors.documentNumber}
                    helperText="Puedes escribirlo con o sin puntos"
                    id="input-num-doc"
                    inputMode="numeric"
                    isMonospace
                    isRequired
                    label="Número de documento"
                    name="documentNumber"
                    onBlur={() => handleFieldBlur('documentNumber')}
                    onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
                    placeholder="Ej. 1098765432"
                    value={values.documentNumber}
                  />
                </div>
              </FormGroup>

              {/* Fieldset opcional: AFILIACIÓN (HU-004). Si el catálogo no carga, no se ofrece. */}
              {!affiliationCatalogs.loading && !affiliationCatalogs.failed
                && affiliationCatalogs.plans.length > 0 && (
                <FormGroup icon="health_and_safety" legend="Afiliación (opcional)">
                  <p className="text-sm text-[#5B6573] -mt-1 mb-1">
                    Si conoces tu EPS puedes registrarla ahora. También puedes dejarlo en blanco y
                    seguir con tu registro.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                      helperText="Déjalo sin seleccionar si prefieres no registrarla"
                      id="select-plan"
                      label="Plan de EPS"
                      name="insurancePlanId"
                      onChange={(e) =>
                        setAffiliation((prev) => ({
                          insurancePlanId: e.target.value,
                          // Al quitar el plan también se limpia el régimen: van en pareja.
                          regimeCode: e.target.value === '' ? '' : prev.regimeCode,
                        }))
                      }
                      options={[
                        { value: '', label: 'Sin afiliación' },
                        ...affiliationCatalogs.plans.map((plan) => ({
                          value: String(plan.id),
                          label: `${plan.epsName} — ${plan.name}`,
                        })),
                      ]}
                      value={affiliation.insurancePlanId}
                    />

                    <SelectField
                      disabled={affiliation.insurancePlanId === ''}
                      errorText={affiliationError ?? undefined}
                      helperText="Contributivo si cotizas; subsidiado si perteneces al SISBÉN"
                      id="select-regimen"
                      label="Régimen"
                      name="regimeCode"
                      onChange={(e) => {
                        setAffiliation((prev) => ({ ...prev, regimeCode: e.target.value }));
                        setAffiliationError(null);
                      }}
                      options={[
                        { value: '', label: 'Selecciona tu régimen' },
                        ...affiliationCatalogs.regimes.map((regime) => ({
                          value: regime.code,
                          label: regime.name,
                        })),
                      ]}
                      value={affiliation.regimeCode}
                    />
                  </div>
                </FormGroup>
              )}

              {/* Fieldset 3: DATOS DE CONTACTO */}
              <FormGroup icon="contacts" legend="Datos de contacto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    autoComplete="email"
                    errorText={errors.email}
                    helperText="Recibirás confirmaciones y recordatorios"
                    id="input-correo"
                    isRequired
                    label="Correo electrónico"
                    name="email"
                    onBlur={() => handleFieldBlur('email')}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    type="email"
                    value={values.email}
                  />

                  <TextField
                    errorText={errors.phone}
                    helperText="Para contactarte sobre tus citas"
                    id="input-telefono"
                    isMonospace
                    isRequired
                    label="Teléfono"
                    name="phone"
                    onBlur={() => handleFieldBlur('phone')}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="300 123 4567"
                    prefix="+57"
                    type="tel"
                    value={values.phone}
                  />
                </div>
              </FormGroup>

              {/* Fieldset 4: SEGURIDAD DE LA CUENTA */}
              <FormGroup icon="lock" legend="Seguridad de la cuenta">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <PasswordField
                    autoComplete="new-password"
                    errorText={errors.password}
                    id="input-password"
                    isRequired
                    label="Contraseña"
                    name="password"
                    onBlur={() => handleFieldBlur('password')}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    placeholder="••••••••••••"
                    value={values.password}
                  />

                  <PasswordField
                    autoComplete="new-password"
                    errorText={errors.confirmPassword}
                    id="input-confirm-password"
                    isRequired
                    label="Confirmar contraseña"
                    name="confirmPassword"
                    onBlur={() => handleFieldBlur('confirmPassword')}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    placeholder="••••••••••••"
                    value={values.confirmPassword}
                  />
                </div>

                {/* Password Criteria Checklist */}
                <PasswordChecklist criteria={passwordCriteria} />
              </FormGroup>

              {/* Submit Primary Button */}
              <div className="pt-2">
                <Button
                  id="btn-submit"
                  isLoading={isLoading}
                  loadingText="Creando cuenta…"
                  type="submit"
                >
                  Crear cuenta
                </Button>
              </div>
            </form>

            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-[#D9DDE3]/60 text-center">
              <p className="text-sm text-[#5B6573]">
                ¿Ya tienes cuenta?{' '}
                <Link
                  className="font-semibold text-[#0F6E6E] hover:text-[#0B5858] transition-colors ml-1 inline-flex items-center gap-0.5 hover:underline"
                  to="/login"
                >
                  <span>Inicia sesión</span>
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[16px] select-none"
                  >
                    arrow_forward
                  </span>
                </Link>
              </p>
            </footer>
          </>
        )}
      </Card>
    </AuthLayout>
  );
};
