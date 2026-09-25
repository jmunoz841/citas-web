import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { RequireRole, Role, RootRedirect, SessionProvider } from './features/auth/session/SessionContext';
import { AppShell } from './shared/layout/AppShell';
import { ToastProvider } from './shared/components/Toast';
import { RequestsPage } from './features/admin/pages/RequestsPage';
import { SpecialtiesPage } from './features/admin/pages/SpecialtiesPage';
import { ProfessionalsPage } from './features/admin/pages/ProfessionalsPage';
import { AgendaPage } from './features/agenda/pages/AgendaPage';
import { PatientHomePage } from './features/booking/pages/PatientHomePage';

/** Ruta protegida por rol dentro de la estructura común de la app. */
const Protected: React.FC<{ role: Role; children: React.ReactNode }> = ({ role, children }) => (
  <RequireRole role={role}>
    <AppShell role={role}>{children}</AppShell>
  </RequireRole>
);

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route element={<RootRedirect />} path="/" />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<RegisterPage />} path="/registro" />

            <Route element={<Navigate replace to="/admin/solicitudes" />} path="/admin" />
            <Route element={<Protected role="ADMIN"><RequestsPage /></Protected>} path="/admin/solicitudes" />
            <Route element={<Protected role="ADMIN"><SpecialtiesPage /></Protected>} path="/admin/especialidades" />
            <Route element={<Protected role="ADMIN"><ProfessionalsPage /></Protected>} path="/admin/profesionales" />

            <Route element={<Protected role="PROFESSIONAL"><AgendaPage /></Protected>} path="/agenda" />

            <Route element={<Protected role="USER"><PatientHomePage /></Protected>} path="/inicio" />

            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
