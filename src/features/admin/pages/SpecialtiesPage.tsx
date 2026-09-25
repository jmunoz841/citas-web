import React, { useState } from 'react';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { Chip, PageHeader, SkeletonRows, StatusLabel } from '../../../shared/components/Feedback';
import { adminApi, Specialty } from '../api/adminApi';
import { useRemoteData } from '../api/useRemoteData';
import {
  ActionDivider,
  ConfirmDialog,
  ErrorMessage,
  LoadErrorBanner,
  TableCard,
  Td,
  TextAction,
  Th,
  toErrorMessage,
} from '../components/AdminUi';
import { formatDuration } from '../components/format';
import { SpecialtyFormDialog } from '../components/SpecialtyFormDialog';

type FormState = { specialty: Specialty | null } | null;

const Footnote: React.FC = () => (
  <p className="flex items-start gap-2">
    <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#0F6E6E] shrink-0">
      info
    </span>
    Las especialidades no pueden eliminarse para garantizar la trazabilidad del historial clínico.
  </p>
);

/** Catálogo de especialidades del ADMIN (HU-006): alta, edición y activación, sin borrado. */
export const SpecialtiesPage: React.FC = () => {
  const { status, data: specialties, setData: setSpecialties, reload } = useRemoteData(adminApi.listSpecialties, []);
  const [form, setForm] = useState<FormState>(null);
  const [toDeactivate, setToDeactivate] = useState<Specialty | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<ErrorMessage | null>(null);
  const [confirmError, setConfirmError] = useState<ErrorMessage | null>(null);

  const replace = (saved: Specialty) =>
    setSpecialties((current) =>
      current.some((s) => s.id === saved.id) ? current.map((s) => (s.id === saved.id ? saved : s)) : [...current, saved],
    );

  const setActive = async (specialty: Specialty, active: boolean) => {
    setPendingId(specialty.id);
    setActionError(null);
    setConfirmError(null);
    try {
      replace(await adminApi.setSpecialtyActive(specialty.id, active));
      setToDeactivate(null);
    } catch (err) {
      if (active) setActionError(toErrorMessage(err));
      else setConfirmError(toErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const openDeactivate = (specialty: Specialty) => {
    setConfirmError(null);
    setToDeactivate(specialty);
  };

  const renderActions = (specialty: Specialty) => (
    <div className="flex items-center justify-end gap-1">
      <TextAction aria-label={`Editar ${specialty.name}`} onClick={() => setForm({ specialty })}>
        Editar
      </TextAction>
      <ActionDivider />
      {specialty.active ? (
        <TextAction
          aria-label={`Desactivar ${specialty.name}`}
          onClick={() => openDeactivate(specialty)}
          tone="muted"
        >
          Desactivar
        </TextAction>
      ) : (
        <TextAction
          aria-label={`Activar ${specialty.name}`}
          disabled={pendingId === specialty.id}
          onClick={() => void setActive(specialty, true)}
        >
          {pendingId === specialty.id ? 'Activando…' : 'Activar'}
        </TextAction>
      )}
    </div>
  );

  const typeCell = (specialty: Specialty) =>
    specialty.general ? (
      <Chip>General</Chip>
    ) : (
      <span className="text-[#5B6573]">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin tipo</span>
      </span>
    );

  const statusCell = (specialty: Specialty) => (
    <StatusLabel active={specialty.active} activeText="Activa" inactiveText="Inactiva" />
  );

  return (
    <>
      <PageHeader
        action={
          <Button fullWidth={false} leadingIcon="add" onClick={() => setForm({ specialty: null })} type="button">
            Nueva especialidad
          </Button>
        }
        subtitle="Gestión del catálogo de servicios, tiempos de consulta y disponibilidad para pacientes."
        title="Especialidades"
      />

      {actionError && <AlertBanner className="mb-4" description={actionError.description} title={actionError.title} />}

      {status === 'error' ? (
        <LoadErrorBanner onRetry={() => void reload()} />
      ) : (
        <TableCard footer={<Footnote />}>
          {status === 'loading' ? (
            <SkeletonRows label="Cargando especialidades…" rows={4} />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9DDE3]">
                      <Th>Nombre</Th>
                      <Th>Duración</Th>
                      <Th>Tipo</Th>
                      <Th>Estado</Th>
                      <Th className="w-px text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialties.map((specialty) => (
                      <tr key={specialty.id} className="border-b border-[#D9DDE3] last:border-b-0">
                        <Td className={`font-semibold ${specialty.active ? '' : 'text-[#5B6573]'}`}>{specialty.name}</Td>
                        <Td className="whitespace-nowrap tabular-nums">{formatDuration(specialty.durationMinutes)}</Td>
                        <Td>{typeCell(specialty)}</Td>
                        <Td className="whitespace-nowrap">{statusCell(specialty)}</Td>
                        <Td className="w-px whitespace-nowrap">{renderActions(specialty)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul aria-label="Especialidades" className="md:hidden divide-y divide-[#D9DDE3]">
                {specialties.map((specialty) => (
                  <li key={specialty.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold text-[#1C2430]">{specialty.name}</p>
                      {statusCell(specialty)}
                    </div>
                    <p className="flex items-center gap-3 text-sm text-[#5B6573]">
                      <span className="tabular-nums">{formatDuration(specialty.durationMinutes)}</span>
                      {specialty.general && <Chip>General</Chip>}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button onClick={() => setForm({ specialty })} type="button" variant="secondary">
                        Editar
                      </Button>
                      {specialty.active ? (
                        <Button onClick={() => openDeactivate(specialty)} type="button" variant="secondary">
                          Desactivar
                        </Button>
                      ) : (
                        <Button
                          isLoading={pendingId === specialty.id}
                          loadingText="Activando…"
                          onClick={() => void setActive(specialty, true)}
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

      {form && (
        <SpecialtyFormDialog
          key={form.specialty?.id ?? 'new'}
          onClose={() => setForm(null)}
          onSaved={(saved) => {
            replace(saved);
            setForm(null);
          }}
          specialty={form.specialty}
        />
      )}

      <ConfirmDialog
        busy={toDeactivate !== null && pendingId === toDeactivate.id}
        busyText="Desactivando…"
        confirmText="Desactivar especialidad"
        error={confirmError}
        icon="power_settings_new"
        message="Los pacientes dejarán de verla al buscar citas. Las citas existentes se conservan."
        onClose={() => setToDeactivate(null)}
        onConfirm={() => toDeactivate && void setActive(toDeactivate, false)}
        open={toDeactivate !== null}
        target={toDeactivate?.name}
        title="Desactivar especialidad"
      />
    </>
  );
};
