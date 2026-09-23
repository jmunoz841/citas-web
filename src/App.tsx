/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { InicioPage } from './pages/InicioPage';
import { hasSession } from './features/auth/session/sessionManager';

/**
 * Root route redirect:
 * / redirects to /inicio when a session exists, otherwise to /login.
 */
const RootRedirect: React.FC = () => {
  if (hasSession()) {
    return <Navigate to="/inicio" replace />;
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/inicio" element={<InicioPage />} />
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
