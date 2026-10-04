import React, { useEffect, useState } from 'react';
import { adminApi, InsurancePlan, InsuranceProvider } from '../api/adminApi';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { PageHeader, StatusLabel } from '../../../shared/components/Feedback';

/** HU-007: administrative EPS and plan management without physical deletion. */
export const InsuranceCatalogPage: React.FC = () => {
  const [eps, setEps] = useState<InsuranceProvider[]>([]);
  const [selected, setSelected] = useState<InsuranceProvider | null>(null);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [name, setName] = useState('');
  const [planName, setPlanName] = useState('');
  const [editingEps, setEditingEps] = useState<InsuranceProvider | null>(null);
  const [editingEpsName, setEditingEpsName] = useState('');
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [editingPlanName, setEditingPlanName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => adminApi.listEps().then(setEps).catch(() => setError('No pudimos cargar el catalogo.'));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (selected) adminApi.listPlans(selected.id).then(setPlans).catch(() => setError('No pudimos cargar los planes.'));
    else setPlans([]);
  }, [selected]);

  const addEps = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const saved = await adminApi.createEps(name); setEps((items) => [...items, saved]); setName(''); }
    catch { setError('No pudimos guardar la EPS.'); }
  };
  const addPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try { const saved = await adminApi.createPlan(selected.id, planName); setPlans((items) => [...items, saved]); setPlanName(''); }
    catch { setError('No pudimos guardar el plan.'); }
  };
  const toggleEps = async (item: InsuranceProvider) => {
    try {
      const saved = await adminApi.setEpsActive(item.id, !item.active);
      setEps((items) => items.map((current) => current.id === saved.id ? saved : current));
      setSelected((current) => current?.id === saved.id ? saved : current);
    } catch { setError('No pudimos actualizar la EPS.'); }
  };
  const togglePlan = async (item: InsurancePlan) => {
    try {
      const saved = await adminApi.setPlanActive(item.id, !item.active);
      setPlans((items) => items.map((current) => current.id === saved.id ? saved : current));
    } catch { setError('No pudimos actualizar el plan.'); }
  };
  const saveEpsName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEps) return;
    try {
      const saved = await adminApi.updateEps(editingEps.id, editingEpsName);
      setEps((items) => items.map((current) => current.id === saved.id ? saved : current));
      setSelected((current) => current?.id === saved.id ? saved : current);
      setEditingEps(null); setEditingEpsName('');
    } catch { setError('No pudimos actualizar la EPS.'); }
  };
  const savePlanName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPlan) return;
    try {
      const saved = await adminApi.updatePlan(editingPlan.id, editingPlanName);
      setPlans((items) => items.map((current) => current.id === saved.id ? saved : current));
      setEditingPlan(null); setEditingPlanName('');
    } catch { setError('No pudimos actualizar el plan.'); }
  };

  return <div className="flex flex-col gap-6">
    <PageHeader title="EPS y planes" subtitle="Administra el catalogo sintetico disponible para afiliaciones." />
    {error && <AlertBanner title="No pudimos continuar" description={error} />}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[#D9DDE3] bg-white p-5"><h2 className="text-lg font-bold">EPS</h2>
        <form className="my-4 flex gap-2" onSubmit={addEps}><input className="flex-1 rounded-lg border px-3" aria-label="Nombre de EPS" value={name} onChange={(event) => setName(event.target.value)} required /><Button fullWidth={false}>Agregar</Button></form>
        <ul>{eps.map((item) => <li key={item.id} className="flex justify-between gap-3 border-t py-3"><button className="text-left font-semibold" onClick={() => setSelected(item)} type="button">{item.name}</button><div className="flex items-center gap-2"><StatusLabel active={item.active} activeText="Activa" inactiveText="Inactiva" /><Button fullWidth={false} size="sm" variant="secondary" onClick={() => { setEditingEps(item); setEditingEpsName(item.name); }} type="button">Editar</Button><Button fullWidth={false} size="sm" variant="secondary" onClick={() => void toggleEps(item)} type="button">{item.active ? 'Desactivar' : 'Activar'}</Button></div></li>)}</ul>
        {editingEps && <form className="mt-4 flex gap-2" onSubmit={saveEpsName}><input className="flex-1 rounded-lg border px-3" aria-label="Nuevo nombre de EPS" value={editingEpsName} onChange={(event) => setEditingEpsName(event.target.value)} required /><Button fullWidth={false}>Guardar</Button><Button fullWidth={false} size="sm" variant="secondary" onClick={() => setEditingEps(null)} type="button">Cancelar</Button></form>}
      </section>
      <section className="rounded-xl border border-[#D9DDE3] bg-white p-5"><h2 className="text-lg font-bold">{selected ? `Planes de ${selected.name}` : 'Selecciona una EPS'}</h2>
        {selected && <><form className="my-4 flex gap-2" onSubmit={addPlan}><input className="flex-1 rounded-lg border px-3" aria-label="Nombre de plan" value={planName} onChange={(event) => setPlanName(event.target.value)} required /><Button fullWidth={false}>Agregar</Button></form>
          <ul>{plans.map((item) => <li key={item.id} className="flex justify-between gap-3 border-t py-3"><span>{item.name}</span><div className="flex gap-2"><Button fullWidth={false} size="sm" variant="secondary" onClick={() => { setEditingPlan(item); setEditingPlanName(item.name); }} type="button">Editar</Button><Button fullWidth={false} size="sm" variant="secondary" onClick={() => void togglePlan(item)} type="button">{item.active ? 'Desactivar' : 'Activar'}</Button></div></li>)}</ul>
          {editingPlan && <form className="mt-4 flex gap-2" onSubmit={savePlanName}><input className="flex-1 rounded-lg border px-3" aria-label="Nuevo nombre del plan" value={editingPlanName} onChange={(event) => setEditingPlanName(event.target.value)} required /><Button fullWidth={false}>Guardar</Button><Button fullWidth={false} size="sm" variant="secondary" onClick={() => setEditingPlan(null)} type="button">Cancelar</Button></form>}
        </>}
      </section>
    </div>
  </div>;
};
