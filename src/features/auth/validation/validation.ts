export interface PasswordCriteria {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export function evaluatePasswordCriteria(password: string): PasswordCriteria {
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isValid = hasMinLength && hasLetter && hasNumber;

  return {
    hasMinLength,
    hasLetter,
    hasNumber,
    isValid,
  };
}

export function isValidEmail(email: string): boolean {
  // RFC 5322 compatible regex for practical email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

export function isValidDocumentNumber(doc: string): boolean {
  const clean = doc.replace(/[\s.-]/g, '');
  // 3–30 letters or digits
  const docRegex = /^[a-zA-Z0-9]{3,30}$/;
  return docRegex.test(clean);
}

export function isValidPhone(phone: string): boolean {
  // 7–20 characters among digits, spaces, "+", "(", ")", "-"
  const phoneRegex = /^[0-9+\s()-]{7,20}$/;
  // Ensure at least 6 digits exist
  const digits = phone.replace(/\D/g, '');
  return phoneRegex.test(phone.trim()) && digits.length >= 6;
}

export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export interface RegisterFormValues {
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export function validateRegisterField(
  field: keyof RegisterFormValues,
  values: RegisterFormValues
): string | undefined {
  const val = (values[field] ?? '').toString().trim();

  // Required check
  if (!val && field !== 'documentType') {
    return 'Este campo es obligatorio.';
  }

  switch (field) {
    case 'firstNames':
      if (val.length > 100) return 'No debe superar los 100 caracteres.';
      break;

    case 'lastNames':
      if (val.length > 100) return 'No debe superar los 100 caracteres.';
      break;

    case 'documentType':
      if (!val) return 'Este campo es obligatorio.';
      break;

    case 'documentNumber':
      if (!isValidDocumentNumber(values.documentNumber)) {
        return 'Ingresa un número de documento válido.';
      }
      break;

    case 'email':
      if (!isValidEmail(values.email)) {
        return 'Ingresa un correo válido.';
      }
      break;

    case 'phone':
      if (!isValidPhone(values.phone)) {
        return 'Ingresa un teléfono válido.';
      }
      break;

    case 'password': {
      const criteria = evaluatePasswordCriteria(values.password);
      if (!criteria.hasMinLength) return 'Al menos 8 caracteres.';
      if (!criteria.hasLetter) return 'Al menos una letra.';
      if (!criteria.hasNumber) return 'Al menos un número.';
      if (getByteLength(values.password) > 72) return 'La contraseña no puede exceder 72 bytes.';
      break;
    }

    case 'confirmPassword':
      if (values.confirmPassword !== values.password) {
        return 'Las contraseñas no coinciden.';
      }
      break;
  }

  return undefined;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const fields: (keyof RegisterFormValues)[] = [
    'firstNames',
    'lastNames',
    'documentType',
    'documentNumber',
    'email',
    'phone',
    'password',
    'confirmPassword',
  ];

  for (const field of fields) {
    const error = validateRegisterField(field, values);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Este campo es obligatorio.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (!values.password) {
    errors.password = 'Este campo es obligatorio.';
  }

  return errors;
}
