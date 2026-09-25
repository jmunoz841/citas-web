import React, { useEffect, useState } from 'react';
import { fetchSites, Site } from '../api/bookingApi';
import { BookingModal } from '../components/BookingModal';
import { useSession } from '../../auth/session/SessionContext';
import { AlertBanner } from '../../../shared/components/AlertBanner';
import { Button } from '../../../shared/components/Button';
import { PageHeader } from '../../../shared/components/Feedback';
import { CONNECTION_ERROR_MESSAGE } from '../../../shared/api/errors';

const SiteInfoCard: React.FC<{ site: Site }> = ({ site }) => (
  <li className="bg-white border border-[#D9DDE3] rounded-xl p-5 shadow-[0_2px_8px_rgba(28,36,48,0.06)] flex items-start gap-3">
    <span className="w-10 h-10 rounded-lg bg-[#E6F2F1] flex items-center justify-center shrink-0">
      <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[22px]">
        location_on
      </span>
    </span>
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-bold text-[#1C2430]">
        {site.code} — {site.name}
      </span>
      <span className="text-xs text-[#5B6573] mt-1 leading-normal">{site.address}</span>
    </div>
  </li>
);

/** Inicio del paciente (USER): saludo, acceso a "Agendar cita" y sedes. */
export const PatientHomePage: React.FC = () => {
  const { session } = useSession();
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesStatus, setSitesStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sitesToken, setSitesToken] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSitesStatus('loading');
    fetchSites()
      .then((items) => {
        if (cancelled) return;
        setSites(items);
        setSitesStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setSitesStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [sitesToken]);

  const firstNames = session?.firstNames?.trim();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        subtitle="Agenda una cita en HIC o ICV sin filas ni llamadas."
        title={firstNames ? `Hola, ${firstNames}` : 'Hola'}
      />

      <section
        aria-labelledby="booking-card-title"
        className="bg-white border border-[#D9DDE3] rounded-xl p-6 sm:p-10 shadow-[0_2px_8px_rgba(28,36,48,0.06)]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6 max-w-2xl">
            <span className="w-14 h-14 rounded-full bg-[#E6F2F1] flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[28px]">
                calendar_month
              </span>
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-[#1C2430]" id="booking-card-title">
                Agenda una cita
              </h2>
              <p className="text-base text-[#5B6573]">
                Medicina General se confirma al instante. Las especialidades requieren aprobación.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              className="w-full md:w-auto px-8"
              fullWidth={false}
              leadingIcon="add_circle"
              onClick={() => setBookingOpen(true)}
              type="button"
            >
              Agendar cita
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="sites-title" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[#1C2430] flex items-center gap-2" id="sites-title">
          <span aria-hidden="true" className="material-symbols-outlined text-[#0F6E6E] text-[20px]">
            apartment
          </span>
          Sedes
        </h2>
        {sitesStatus === 'error' ? (
          <AlertBanner description={CONNECTION_ERROR_MESSAGE} title="No pudimos cargar las sedes">
            <Button fullWidth={false} onClick={() => setSitesToken((n) => n + 1)} size="sm" type="button" variant="secondary">
              Reintentar
            </Button>
          </AlertBanner>
        ) : sitesStatus === 'loading' ? (
          <div aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 gap-6" role="status">
            <span className="sr-only">Cargando sedes…</span>
            {[0, 1].map((i) => (
              <span key={i} className="h-24 rounded-xl bg-white border border-[#D9DDE3] animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sites.map((site) => (
              <SiteInfoCard key={site.code} site={site} />
            ))}
          </ul>
        )}
      </section>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} sites={sites} />}
    </div>
  );
};
