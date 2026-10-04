import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../shared/api/apiClient';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { PageHeader } from '../../../shared/components/Feedback';
import { TextField } from '../../../shared/components/TextField';

type Profile = { firstNames: string; lastNames: string; documentType: string; documentNumber: string; email: string; phone: string };
export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { apiRequest<Profile>('/api/v1/auth/profile').then(setProfile).catch(() => setError('No pudimos cargar tu perfil.')); }, []);
  const change = (key: keyof Profile, value: string) => setProfile((p) => p ? { ...p, [key]: value } : p);
  const save = async (e: React.FormEvent) => { e.preventDefault(); if (!profile) return; setSaving(true); setError(null); try { setProfile(await apiRequest<Profile>('/api/v1/auth/profile', { method: 'PATCH', body: { firstNames: profile.firstNames, lastNames: profile.lastNames, phone: profile.phone } })); } catch { setError('No pudimos guardar los cambios.'); } finally { setSaving(false); } };
  return <div className="max-w-2xl"><PageHeader title="Mi perfil" subtitle="Mantén actualizados tus datos de contacto." />
    {error && <AlertBanner className="mt-6" title="No pudimos continuar" description={error} />}
    {!profile ? <p className="mt-6 text-[#5B6573]">Cargando perfil…</p> : <form className="mt-6 bg-white border border-[#D9DDE3] rounded-xl p-6 flex flex-col gap-5" onSubmit={save}>
      <div className="grid sm:grid-cols-2 gap-4"><TextField id="profile-first-names" label="Nombres" isRequired value={profile.firstNames} onChange={(e) => change('firstNames', e.target.value)} /><TextField id="profile-last-names" label="Apellidos" isRequired value={profile.lastNames} onChange={(e) => change('lastNames', e.target.value)} /></div>
      <TextField id="profile-phone" label="Teléfono" isRequired value={profile.phone} onChange={(e) => change('phone', e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-4"><TextField id="profile-email" label="Correo electrónico" disabled value={profile.email} helperText="No es editable." /><TextField id="profile-document" label="Documento" disabled value={`${profile.documentType} ${profile.documentNumber}`} helperText="No es editable." /></div>
      <Button fullWidth={false} isLoading={saving} loadingText="Guardando…" type="submit">Guardar cambios</Button>
    </form>}</div>;
};
