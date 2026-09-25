import React, { useId, useRef, useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { ApiError } from '../../../shared/api/errors';
import { ErrorSummary, ErrorSummaryItem } from '../../../shared/components/ErrorSummary';
import { FormGroup } from '../../../shared/components/FormGroup';
import { PasswordChecklist } from '../../../shared/components/PasswordChecklist';
import { PasswordField } from '../../../shared/components/PasswordField';
import { evaluatePasswordCriteria, RegisterFormValues, validateRegisterField } from '../../auth/validation/validation';
import { useDocumentTypes } from '../../catalogs/hooks/useDocumentTypes';
import { Site } from '../../catalogs/api/catalogsApi';
import { adminApi, Professional, Specialty } from '../api/adminApi';
import { ErrorMessage, toErrorMessage } from './AdminUi';
import {
  AssignmentsErrors,
  AssignmentsFields,
  AssignmentsValue,
  toSpecialtyAssignments,
  validateAssignments,
} from './AssignmentsFields';

interface PersonalValues {
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  temporaryPassword: string;
  professionalCode: string;
  licenseNumber: string;
}

type FieldKey = keyof PersonalValues | 'specialties' | 'siteCodes';
type FormErrors = Partial<Record<FieldKey, string>>;

const FIELD_ORDER: FieldKey[] = [
  'firstNames',
  'lastNames',
  'documentType',
  'documentNumber',
  'email',
  'phone',
  'temporaryPassword',
  'professionalCode',
  'licenseNumber',
  'specialties',
  'siteCodes',
];

const LABELS: Record<FieldKey, string> = {
  firstNames: 'Nombres',
  lastNames: 'Apellidos',
  documentType: 'Tipo de documento',
  documentNumber: 'Número de documento',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  temporaryPassword: 'Contraseña temporal',
  professionalCode: 'Código profesional',
  licenseNumber: 'Matrícula',
  specialties: 'Especialidades',
  siteCodes: 'Sedes de atención',
};

const REQUIRED = 'Este campo es obligatorio.';
const CODE_MAX = 30;

const EMPTY: PersonalValues = {
  firstNames: '',
  lastNames: '',
  documentType: 'CC',
  documentNumber: '',
  email: '',
  phone: '',
  temporaryPassword: '',
  professionalCode: '',
  licenseNumber: '',
};

/** Reglas del cliente: las mismas del registro (HU-001) más código y matrícula obligatorios. */
function validatePersonal(values: PersonalValues): FormErrors {
  const asRegister: RegisterFormValues = {
    ...values,
    password: values.temporaryPassword,
    confirmPassword: values.temporaryPassword,
  };
  const errors: FormErrors = {};
  const shared: [keyof PersonalValues, keyof RegisterFormValues][] = [
    ['firstNames', 'firstNames'],
    ['lastNames', 'lastNames'],
    ['documentType', 'documentType'],
    ['documentNumber', 'documentNumber'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['temporaryPassword', 'password'],
  ];
  for (const [field, registerField] of shared) {
    const error = validateRegisterField(registerField, asRegister);
    if (error) errors[field] = error;
  }
  for (const field of ['professionalCode', 'licenseNumber'] as const) {
    const value = values[field].trim();
    if (!value) errors[field] = REQUIRED;
    else if (value.length > CODE_MAX) errors[field] = `No debe superar los ${CODE_MAX} caracteres.`;
  }
  return errors;
}

/** Traduce un 400/409 de la API a errores por campo. */
function serverFieldErrors(err: ApiError): FormErrors {
  const errors: FormErrors = {};
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    const key = field.startsWith('specialties') ? 'specialties' : field.startsWith('siteCodes') ? 'siteCodes' : field;
    if ((FIELD_ORDER as string[]).includes(key)) errors[key as FieldKey] = message;
  }
  if (err.code === 'PROFESSIONAL_CODE_ALREADY_REGISTERED') {
    errors.professionalCode = 'El código profesional ya está registrado';
  }
  if (err.code === 'LICENSE_ALREADY_REGISTERED') {
    errors.licenseNumber = 'La matrícula ya está registrada';
  }
  return errors;
}

interface ProfessionalFormDialogProps {
  /** Solo especialidades activas: la API rechaza asignar una inactiva. */
  specialties: Specialty[];
  sites: Site[];
  onClose: () => void;
  onCreated: (professional: Professional) => void;
}

/** "Nuevo profesional" (HU-008): crea la cuenta PROFESSIONAL con sus asignaciones. */
export const ProfessionalFormDialog: React.FC<ProfessionalFormDialogProps> = ({
  specialties,
  sites,
  onClose,
  onCreated,
}) => {
  const [values, setValues] = useState<PersonalValues>(EMPTY);
  const [assignments, setAssignments] = useState<AssignmentsValue>({ specialtyIds: [], primaryId: null, siteCodes: [] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [summary, setSummary] = useState<ErrorSummaryItem[]>([]);
  const [banner, setBanner] = useState<ErrorMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const documentTypes = useDocumentTypes();
  const formId = useId();

  const ids: Record<FieldKey, string> = Object.fromEntries(FIELD_ORDER.map((f) => [f, `${formId}-${f}`])) as Record<
    FieldKey,
    string
  >;

  const setField = (field: keyof PersonalValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const changeAssignments = (next: AssignmentsValue) => {
    setAssignments(next);
    if (errors.specialties || errors.siteCodes) {
      const stillInvalid = validateAssignments(next);
      setErrors((prev) => ({
        ...prev,
        specialties: prev.specialties && stillInvalid.specialties ? prev.specialties : undefined,
        siteCodes: prev.siteCodes && stillInvalid.siteCodes ? prev.siteCodes : undefined,
      }));
    }
  };

  const focusField = (field: FieldKey) => {
    document.getElementById(ids[field])?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBanner(null);
    setSummary([]);
    const assignmentErrors: AssignmentsErrors = validateAssignments(assignments);
    const localErrors: FormErrors = { ...validatePersonal(values), ...assignmentErrors };
    const firstInvalid = FIELD_ORDER.find((f) => localErrors[f]);
    setErrors(localErrors);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setBusy(true);
    try {
      const created = await adminApi.createProfessional({
        firstNames: values.firstNames.trim(),
        lastNames: values.lastNames.trim(),
        documentType: values.documentType,
        documentNumber: values.documentNumber.replace(/[\s.-]/g, ''),
        email: values.email.trim(),
        phone: values.phone.trim(),
        temporaryPassword: values.temporaryPassword,
        professionalCode: values.professionalCode.trim(),
        licenseNumber: values.licenseNumber.trim(),
        specialties: toSpecialtyAssignments(assignments),
        siteCodes: assignments.siteCodes,
      });
      onCreated(created);
    } catch (err) {
      setBusy(false);
      const fieldErrors = err instanceof ApiError ? serverFieldErrors(err) : {};
      const invalid = FIELD_ORDER.filter((f) => fieldErrors[f]);
      if (invalid.length > 0) {
        setErrors(fieldErrors);
        setSummary(invalid.map((f) => ({ fieldId: ids[f], label: LABELS[f], reason: fieldErrors[f] })));
        setTimeout(() => summaryRef.current?.focus(), 0);
      } else {
        setBanner(toErrorMessage(err));
        setTimeout(() => bannerRef.current?.focus(), 0);
      }
    }
  };

  const criteria = evaluatePasswordCriteria(values.temporaryPassword);
  const text = (field: keyof PersonalValues) => ({
    errorText: errors[field],
    id: ids[field],
    isRequired: true,
    label: LABELS[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(field, e.target.value),
    value: values[field],
  });

  return (
    <Modal
      busy={busy}
      footer={
        <>
          <Button disabled={busy} fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button form={formId} fullWidth={false} isLoading={busy} loadingText="Creando profesional…" type="submit">
            Crear profesional
          </Button>
        </>
      }
      icon="person_add"
      maxWidth="760px"
      onClose={onClose}
      open
      title="Nuevo profesional"
    >
      <form className="flex flex-col gap-8" id={formId} noValidate onSubmit={handleSubmit}>
        {(summary.length > 0 || banner) && (
          <div>
            <ErrorSummary ref={summaryRef} className="mb-0" items={summary} />
            {banner && <AlertBanner ref={bannerRef} description={banner.description} title={banner.title} />}
          </div>
        )}

        <FormGroup icon="person" legend="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TextField {...text('firstNames')} autoComplete="off" data-autofocus />
            <TextField {...text('lastNames')} autoComplete="off" />
          </div>
        </FormGroup>

        <FormGroup icon="badge" legend="Documento de identidad">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SelectField
              disabled={documentTypes.loading || documentTypes.failed}
              errorText={
                errors.documentType || (documentTypes.failed ? 'No pudimos cargar los tipos de documento.' : undefined)
              }
              id={ids.documentType}
              isRequired
              label={LABELS.documentType}
              onChange={(e) => setField('documentType', e.target.value)}
              options={documentTypes.loading ? [{ value: values.documentType, label: 'Cargando…' }] : documentTypes.options}
              value={values.documentType}
            />
            <TextField {...text('documentNumber')} autoComplete="off" inputMode="text" isMonospace />
          </div>
        </FormGroup>

        <FormGroup icon="contacts" legend="Datos de contacto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TextField {...text('email')} autoComplete="off" inputMode="email" type="email" />
            <TextField {...text('phone')} autoComplete="off" className="tabular-nums" inputMode="tel" type="tel" />
          </div>
        </FormGroup>

        <FormGroup icon="lock" legend="Acceso">
          <PasswordField
            autoComplete="new-password"
            errorText={errors.temporaryPassword}
            id={ids.temporaryPassword}
            isRequired
            label={LABELS.temporaryPassword}
            onChange={(e) => setField('temporaryPassword', e.target.value)}
            value={values.temporaryPassword}
          />
          <PasswordChecklist criteria={criteria} />
        </FormGroup>

        <FormGroup icon="clinical_notes" legend="Datos profesionales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TextField {...text('professionalCode')} autoComplete="off" isMonospace maxLength={CODE_MAX} />
            <TextField {...text('licenseNumber')} autoComplete="off" isMonospace maxLength={CODE_MAX} />
          </div>
        </FormGroup>

        <AssignmentsFields
          errors={{ specialties: errors.specialties, siteCodes: errors.siteCodes }}
          onChange={changeAssignments}
          sites={sites}
          sitesGroupId={ids.siteCodes}
          specialties={specialties}
          specialtiesGroupId={ids.specialties}
          value={assignments}
        />
      </form>
    </Modal>
  );
};
