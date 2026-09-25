import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthApi } from '../api/authApi';
import { AuthError } from '../api/types';
import { saveTokens } from '../session/sessionManager';
import { LoginFormErrors, LoginFormValues, validateLoginForm } from '../validation/validation';
import { AuthLayout } from '../components/AuthLayout';
import { Card } from '../components/Card';
import { TextField } from '../../../shared/components/TextField';
import { PasswordField } from '../components/PasswordField';
import { Button } from '../../../shared/components/Button';
import { AlertBanner } from '../../../shared/components/AlertBanner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authBanner, setAuthBanner] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const bannerRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof LoginFormValues, value: string) => {
    const updated = { ...values, [field]: value };
    setValues(updated);

    if (hasSubmitted) {
      const validationErrors = validateLoginForm(updated);
      setErrors((prev) => ({
        ...prev,
        [field]: validationErrors[field],
      }));
    }

    if (authBanner) {
      setAuthBanner(null);
    }
  };

  const handleFieldBlur = (field: keyof LoginFormValues) => {
    if (hasSubmitted) {
      const validationErrors = validateLoginForm(values);
      setErrors((prev) => ({
        ...prev,
        [field]: validationErrors[field],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setAuthBanner(null);

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.email) {
        emailInputRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      const api = getAuthApi();
      const tokens = await api.login({
        email: values.email.trim(),
        password: values.password,
      });

      saveTokens(tokens);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        if (err.code === 'INVALID_CREDENTIALS' || err.status === 401) {
          setAuthBanner({
            title: 'Acceso no autorizado',
            description: 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
          });
        } else if (err.code === 'NETWORK_ERROR' || err.status >= 500) {
          setAuthBanner({
            title: 'Error de conexión',
            description: 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
          });
        } else {
          setAuthBanner({
            title: 'Error de inicio de sesión',
            description: err.detail || 'Ocurrió un error inesperado. Inténtalo de nuevo.',
          });
        }
      } else {
        setAuthBanner({
          title: 'Error de inicio de sesión',
          description: 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
        });
      }

      // Move focus to alert banner for screen readers and keyboard users
      setTimeout(() => {
        bannerRef.current?.focus();
      }, 50);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout cardMaxWidth="480px">
      <Card>
        {/* Header */}
        <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em]">
          Inicia sesión
        </h1>
        <p className="text-sm sm:text-base text-[#5B6573] mt-1 mb-6">
          Accede para gestionar tus citas.
        </p>

        {/* Invalid Credentials / Error Banner */}
        {authBanner && (
          <AlertBanner
            ref={bannerRef}
            className="mb-6"
            description={authBanner.description}
            title={authBanner.title}
          />
        )}

        {/* Login Form */}
        <form
          className="flex flex-col gap-6"
          id="login-form"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* Field 1: Correo electrónico */}
          <TextField
            ref={emailInputRef}
            autoComplete="email"
            errorText={errors.email}
            id="email-input"
            isRequired
            label="Correo electrónico"
            name="email"
            onBlur={() => handleFieldBlur('email')}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            requiredBadge="Requerido"
            type="email"
            value={values.email}
          />

          {/* Field 2: Contraseña */}
          <PasswordField
            autoComplete="current-password"
            errorText={errors.password}
            id="password-input"
            isRequired
            label="Contraseña"
            name="password"
            onBlur={() => handleFieldBlur('password')}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            placeholder="••••••••••••"
            rightLink={
              <button
                aria-disabled="true"
                className="text-xs text-[#0F6E6E] hover:text-[#084747] font-medium hover:underline transition-colors focus-visible:outline-none focus-visible:underline cursor-pointer"
                onClick={(e) => e.preventDefault()}
                title="Disponible próximamente"
                type="button"
              >
                ¿Olvidaste tu contraseña?
              </button>
            }
            value={values.password}
          />

          {/* Primary Action Button */}
          <div className="pt-2">
            <Button
              icon="arrow_forward"
              id="submit-button"
              isLoading={isLoading}
              loadingText="Ingresando…"
              type="submit"
            >
              Iniciar sesión
            </Button>
          </div>
        </form>

        {/* Footer: Sign up link */}
        <div className="mt-8 pt-6 border-t border-[#D9DDE3]/60 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-[#5B6573]">
            ¿No tienes cuenta?{' '}
            <Link
              className="text-[#0F6E6E] hover:text-[#084747] font-semibold hover:underline ml-1"
              to="/registro"
            >
              Crea tu cuenta
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
