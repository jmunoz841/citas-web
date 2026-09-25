import React, { useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Chip, PageHeader, SiteBadge, SkeletonRows, StatusLabel } from '../../../shared/components/Feedback';
import { getCatalogsApi, Site } from '../../catalogs/api/catalogsApi';
import { adminApi, Professional, Specialty } from '../api/adminApi';
import { useRemoteData } from '../api/useRemoteData';
import {
  ActionDivider,
  ConfirmDialog,
  ErrorMessage,
  Initials,
  LoadErrorBanner,
  TableCard,
  Td,
  TextAction,
  Th,
  toErrorMessage,
} from '../components/AdminUi';
import { AssignmentsDrawer } from '../components/AssignmentsDrawer';
import { ProfessionalFormDialog } from '../components/ProfessionalFormDialog';

interface ProfessionalsData {
  professionals: Professional[];
  specialties: Specialty[];
  sites: Site[];
}

/** Profesionales, especialidades (para resolver nombres) y sedes del catálogo, en paralelo. */
async function loadProfessionalsData(): Promise<ProfessionalsData> {
  const [professionals, specialties, sites] = await Promise.all([
    adminApi.listProfessionals(),
    adminApi.listSpecialties(),
    getCatalogsApi().sites(),
  ]);
  return { professionals, specialties, sites };
}

const EMPTY_DATA: ProfessionalsData = { professionals: [], specialties: [], sites: [] };

const fullName = (p: Professional) => `${p.firstNames} ${p.lastNames}`;

/** Chips de especialidades: la principal primero, con estrella y "(principal)". */
const SpecialtyChips: React.FC<{ professional: Professional; names: Map<number, string> }> = ({ professional, names }) => {
  const sorted = [...professional.specialties].sort((a, b) => Number(b.primary) - Number(a.primary));
  return (
    <ul className="flex flex-wrap gap-1.5">
      {sorted.map((assignment) => {
        const name = names.get(assignment.specialtyId) ?? `#${assignment.specialtyId}`;
        return (
          <li key={assignment.specialtyId}>
            {assignment.primary ? (
              <Chip icon="star">{name} (principal)</Chip>
            ) : (
              <Chip tone="neutral">{name}</Chip>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const SiteChips: React.FC<{ codes: string[]; sites: Site[] }> = ({ codes, sites }) => (
  <span className="flex flex-wrap gap-1.5">
    {[...codes].sort().map((code) => (
      <SiteBadge key={code} code={code} title={sites.find((s) => s.code === code)?.name} />
    ))}
  </span>
);

/** Directorio de profesionales del ADMIN (HU-008 alta y asignaciones, HU-009 activación). */
export const ProfessionalsPage: React.FC = () => {
  const { status, data, setData, reload } = useRemoteData(loadProfessionalsData, EMPTY_DATA);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Professional | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<ErrorMessage | null>(null);
  const [confirmError, setConfirmError] = useState<ErrorMessage | null>(null);

  const { professionals, specialties, sites } = data;
  const names = new Map(specialties.map((s) => [s.id, s.name]));
  const editing = professionals.find((p) => p.id === editingId) ?? null;

  const upsert = (saved: Professional) =>
    setData((current) => ({
      ...current,
      professionals: current.professionals.some((p) => p.id === saved.id)
        ? current.professionals.map((p) => (p.id === saved.id ? saved : p))
        : [...current.professionals, saved],
    }));

  const setActive = async (professional: Professional, active: boolean) => {
    setPendingId(professional.id);
    setActionError(null);
    setConfirmError(null);
    try {
      upsert(await adminApi.setProfessionalActive(professional.id, active));
      setToDeactivate(null);
    } catch (err) {
      if (active) setActionError(toErrorMessage(err));
      else setConfirmError(toErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const openDeactivate = (professional: Professional) => {
    setConfirmError(null);
    setToDeactivate(professional);
  };

  const statusCell = (p: Professional) => <StatusLabel active={p.active} activeText="Activo" inactiveText="Inactivo" />;

  const count = professionals.length;

  return (
    <>
      <PageHeader
        action={
          <Button
            disabled={status !== 'ready'}
            fullWidth={false}
            leadingIcon="add"
            onClick={() => setCreating(true)}
            type="button"
          >
            Nuevo profesional
          </Button>
        }
        subtitle="Administración de credenciales, matrículas, sedes y especialidades vinculadas en CitaClara."
        title="Profesionales"
      />

      {actionError && <AlertBanner className="mb-4" description={actionError.description} title={actionError.title} />}

      {status === 'error' ? (
        <LoadErrorBanner onRetry={() => void reload()} />
      ) : (
        <TableCard footer={status === 'ready' ? `${count} ${count === 1 ? 'profesional' : 'profesionales'}` : undefined}>
          {status === 'loading' ? (
            <SkeletonRows label="Cargando profesionales…" rows={3} />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9DDE3]">
                      <Th>Nombre</Th>
                      <Th>Código</Th>
                      <Th>Matrícula</Th>
                      <Th>Especialidades</Th>
                      <Th>Sedes</Th>
                      <Th>Estado</Th>
                      <Th className="w-px text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionals.map((p) => (
                      <tr key={p.id} className="border-b border-[#D9DDE3] last:border-b-0">
                        <Td>
                          <span className="flex items-center gap-3">
                            <Initials name={fullName(p)} size="md" />
                            <span className="flex flex-col min-w-0">
                              <span className="font-semibold">{fullName(p)}</span>
                              <span className="text-xs text-[#5B6573] block max-w-[160px] truncate" title={p.email}>{p.email}</span>
                            </span>
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap font-mono tabular-nums text-[13px]">{p.professionalCode}</Td>
                        <Td className="whitespace-nowrap font-mono tabular-nums text-[13px]">{p.licenseNumber}</Td>
                        <Td>
                          <SpecialtyChips names={names} professional={p} />
                        </Td>
                        <Td>
                          <SiteChips codes={p.siteCodes} sites={sites} />
                        </Td>
                        <Td className="whitespace-nowrap">{statusCell(p)}</Td>
                        <Td className="w-px whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <TextAction aria-label={`Editar asignaciones de ${fullName(p)}`} onClick={() => setEditingId(p.id)}>
                              Editar asignaciones
                            </TextAction>
                            <ActionDivider />
                            {p.active ? (
                              <TextAction aria-label={`Desactivar a ${fullName(p)}`} onClick={() => openDeactivate(p)} tone="danger">
                                Desactivar
                              </TextAction>
                            ) : (
                              <TextAction
                                aria-label={`Activar a ${fullName(p)}`}
                                disabled={pendingId === p.id}
                                onClick={() => void setActive(p, true)}
                              >
                                {pendingId === p.id ? 'Activando…' : 'Activar'}
                              </TextAction>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul aria-label="Profesionales" className="md:hidden divide-y divide-[#D9DDE3]">
                {professionals.map((p) => (
                  <li key={p.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <Initials name={fullName(p)} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[#1C2430]">{fullName(p)}</p>
                        <p className="text-sm text-[#5B6573] break-all">{p.email}</p>
                        <p className="text-sm text-[#5B6573] font-mono tabular-nums mt-1">
                          {p.professionalCode} · {p.licenseNumber}
                        </p>
                      </div>
                      {statusCell(p)}
                    </div>
                    <SpecialtyChips names={names} professional={p} />
                    <SiteChips codes={p.siteCodes} sites={sites} />
                    <div className="grid grid-cols-1 gap-3 pt-1">
                      <Button onClick={() => setEditingId(p.id)} type="button" variant="secondary">
                        Editar asignaciones
                      </Button>
                      {p.active ? (
                        <Button onClick={() => openDeactivate(p)} type="button" variant="secondary">
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          isLoading={pendingId === p.id}
                          loadingText="Activando…"
                          onClick={() => void setActive(p, true)}
                          type="button"
                          variant="secondary"
                        >
                          Activar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TableCard>
      )}

      {creating && (
        <ProfessionalFormDialog
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            upsert(created);
            setCreating(false);
          }}
          sites={sites}
          specialties={specialties.filter((s) => s.active)}
        />
      )}

      {editing && (
        <AssignmentsDrawer
          key={editing.id}
          onClose={() => setEditingId(null)}
          onUpdated={upsert}
          professional={editing}
          sites={sites}
          specialties={specialties}
        />
      )}

      <ConfirmDialog
        busy={toDeactivate !== null && pendingId === toDeactivate.id}
        busyText="Desactivando…"
        confirmText="Confirmar desactivación"
        error={confirmError}
        icon="person_off"
        message="El profesional dejará de aparecer en la búsqueda de citas. Sus datos, asignaciones y citas existentes se conservan."
        onClose={() => setToDeactivate(null)}
        onConfirm={() => toDeactivate && void setActive(toDeactivate, false)}
        open={toDeactivate !== null}
        target={toDeactivate ? `${fullName(toDeactivate)} (${toDeactivate.professionalCode})` : undefined}
        title="Desactivar profesional"
      />
    </>
  );
};
