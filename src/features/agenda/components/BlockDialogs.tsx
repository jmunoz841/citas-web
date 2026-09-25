import React, { useRef, useState } from 'react';
import { ApiError, CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { SiteBadge } from '../../../shared/components/Feedback';
import { Modal } from '../../../shared/components/Modal';
import { AvailabilityBlock, deleteBlock, Site } from '../api/agendaApi';
import { blockRange } from '../utils/blocks';
import { formatLongDay, parseIsoDate } from '../utils/dates';
import { CONFLICT_MESSAGE } from './BlockFormDialog';

const spaces = (n: number) => (n === 1 ? '1 espacio' : `${n} espacios`);

const BlockSummary: React.FC<{ block: AvailabilityBlock; sites: Site[] }> = ({ block, sites }) => {
  const siteName = sites.find((s) => s.code === block.siteCode)?.name;
  return (
    <dl className="flex flex-col gap-3 text-sm text-[#1C2430]">
      <div className="flex items-center gap-2">
        <dt className="sr-only">Sede</dt>
        <dd className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#5B6573]">
            apartment
          </span>
          <SiteBadge code={block.siteCode} />
          {siteName && <span>{siteName}</span>}
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt className="sr-only">Espacios</dt>
        <dd className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#5B6573]">
            event_available
          </span>
          {spaces(block.slots)} de 30 minutos
        </dd>
      </div>
    </dl>
  );
};

interface BlockDetailsDialogProps {
  block: AvailabilityBlock;
  sites: Site[];
  past: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Detalle de un bloque con sus acciones; los bloques pasados no tienen acciones. */
export const BlockDetailsDialog: React.FC<BlockDetailsDialogProps> = ({ block, sites, past, canEdit, onClose, onEdit, onDelete }) => (
  <Modal
    footer={
      past ? undefined : (
        <>
          <Button className="sm:w-auto" onClick={onDelete} type="button" variant="secondary">
            Eliminar
          </Button>
          {canEdit && (
            <Button className="sm:w-auto" onClick={onEdit} type="button">
              Editar
            </Button>
          )}
        </>
      )
    }
    icon="event"
    maxWidth="420px"
    onClose={onClose}
    open
    subtitle={formatLongDay(parseIsoDate(block.date))}
    title={blockRange(block)}
  >
    <BlockSummary block={block} sites={sites} />
    {past && <p className="text-sm text-[#5B6573] mt-4">Este bloque ya pasó y no se puede modificar.</p>}
  </Modal>
);

interface DeleteBlockDialogProps {
  block: AvailabilityBlock;
  sites: Site[];
  onClose: () => void;
  onDeleted: (block: AvailabilityBlock) => void;
}

/** Confirmación de borrado; el 409 `BLOCK_HAS_APPOINTMENTS` se muestra como advertencia. */
export const DeleteBlockDialog: React.FC<DeleteBlockDialogProps> = ({ block, sites, onClose, onDeleted }) => {
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'error' | 'warning'; title: string; description: string } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const confirm = async () => {
    setBusy(true);
    setBanner(null);
    try {
      await deleteBlock(block.id);
      onDeleted(block);
    } catch (err) {
      setBusy(false);
      const error = err instanceof ApiError ? err : null;
      if (error?.code === 'BLOCK_HAS_APPOINTMENTS') {
        setBanner({ tone: 'warning', title: 'No se puede eliminar', description: CONFLICT_MESSAGE });
      } else if (!error || error.isConnectionProblem) {
        setBanner({ tone: 'error', title: 'Sin conexión', description: CONNECTION_ERROR_MESSAGE });
      } else {
        setBanner({ tone: 'error', title: 'No se pudo eliminar', description: error.detail });
      }
      requestAnimationFrame(() => bannerRef.current?.focus());
    }
  };

  const blocked = banner?.tone === 'warning';

  return (
    <Modal
      busy={busy}
      footer={
        <>
          <Button className="sm:w-auto" disabled={busy} onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          {!blocked && (
            <Button className="sm:w-auto" isLoading={busy} leadingIcon="delete" loadingText="Eliminando…" onClick={confirm} type="button" variant="danger">
              Eliminar bloque
            </Button>
          )}
        </>
      }
      icon="delete"
      iconTone="danger"
      maxWidth="480px"
      onClose={onClose}
      open
      subtitle={`Se eliminarán sus ${spaces(block.slots)}.`}
      title="¿Eliminar este bloque?"
    >
      <div className="flex flex-col gap-4">
        {banner && <AlertBanner ref={bannerRef} description={banner.description} title={banner.title} tone={banner.tone} />}
        <div className="rounded-lg border border-[#D9DDE3] p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-[#1C2430]">
            {formatLongDay(parseIsoDate(block.date))} · <span className="tabular-nums">{blockRange(block)}</span>
          </p>
          <BlockSummary block={block} sites={sites} />
        </div>
      </div>
    </Modal>
  );
};
