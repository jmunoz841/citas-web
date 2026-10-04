import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthApi } from '../api/authApi';
import { AuthError } from '../api/types';
import { evaluatePasswordCriteria, isValidEmail, ResetPasswordFormErrors, ResetPasswordFormValues, validateResetPasswordForm } from '../validation/validation';
import { AuthLayout } from '../components/AuthLayout';
import { Card } from '../components/Card';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { PasswordChecklist } from '../../../shared/components/PasswordChecklist';
import { PasswordField } from '../../../shared/components/PasswordField';
import { TextField } from '../../../shared/components/TextField';

export const PasswordRecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!isValidEmail(email)) { setError('Ingresa un correo válido.'); return; }
    setLoading(true);
    try { await getAuthApi().requestPasswordReset(email.trim()); setSent(true); }
    catch { setError('No pudimos procesar la solicitud. Inténtalo de nuevo.'); setTimeout(() => alertRef.current?.focus(), 50); }
    finally { setLoading(false); }
  };

  return <AuthLayout cardMaxWidth="480px"><Card>
    <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em]">Recupera tu contraseña</h1>
    {sent ? <div className="mt-5"><AlertBanner ref={alertRef} title="Revisa tu correo" description="Si la cuenta existe, recibirás las instrucciones para restablecer tu contraseña." />
      <Link className="mt-6 inline-block font-semibold text-[#0F6E6E] hover:underline" to="/restablecer-contrasena">Ya tengo un código de recuperación</Link>
    </div> : <form className="mt-6 flex flex-col gap-6" noValidate onSubmit={submit}>
      <p className="text-sm text-[#5B6573]">Te enviaremos instrucciones al correo asociado a tu cuenta.</p>
      {error && <AlertBanner ref={alertRef} description={error} title="No pudimos continuar" />}
      <TextField autoComplete="email" errorText={error ?? undefined} id="recovery-email" isRequired label="Correo electrónico" name="email" onChange={(e) => setEmail(e.target.value)} type="email" value={email} />
      <Button isLoading={loading} loadingText="Enviando…" type="submit">Enviar instrucciones</Button>
    </form>}
    <p className="mt-8 text-center text-sm text-[#5B6573]"><Link className="font-semibold text-[#0F6E6E] hover:underline" to="/login">Volver a iniciar sesión</Link></p>
  </Card></AuthLayout>;
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<ResetPasswordFormValues>({ token: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const change = (field: keyof ResetPasswordFormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setServerError(null);
    const nextErrors = validateResetPasswordForm(values); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try { await getAuthApi().resetPassword({ token: values.token.trim(), password: values.password }); navigate('/login', { replace: true, state: { passwordReset: true } }); }
    catch (err: unknown) {
      setServerError(err instanceof AuthError && err.code === 'INVALID_PASSWORD_RESET_TOKEN'
        ? 'El código de recuperación no es válido o ya venció.' : 'No pudimos restablecer la contraseña. Inténtalo de nuevo.');
      setTimeout(() => alertRef.current?.focus(), 50);
    } finally { setLoading(false); }
  };
  return <AuthLayout cardMaxWidth="480px"><Card>
    <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em]">Define una nueva contraseña</h1>
    <form className="mt-6 flex flex-col gap-6" noValidate onSubmit={submit}>
      {serverError && <AlertBanner ref={alertRef} description={serverError} title="No pudimos continuar" />}
      <TextField autoComplete="off" errorText={errors.token} id="reset-token" isRequired label="Código de recuperación" name="token" onChange={(e) => change('token', e.target.value)} value={values.token} />
      <PasswordField autoComplete="new-password" errorText={errors.password} id="reset-password" isRequired label="Nueva contraseña" name="password" onChange={(e) => change('password', e.target.value)} value={values.password} />
      <PasswordField autoComplete="new-password" errorText={errors.confirmPassword} id="reset-confirm-password" isRequired label="Confirmar nueva contraseña" name="confirmPassword" onChange={(e) => change('confirmPassword', e.target.value)} value={values.confirmPassword} />
      <PasswordChecklist criteria={evaluatePasswordCriteria(values.password)} />
      <Button isLoading={loading} loadingText="Guardando…" type="submit">Restablecer contraseña</Button>
    </form>
  </Card></AuthLayout>;
};
