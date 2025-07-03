// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Importaciones directas de páginas
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
// Se mantiene la misma importación, ya que el componente de la página es el mismo
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';

console.log('[AppRoutes] Configurando rutas');

// --- COMPONENTE PROTECTEDROUTE (sin cambios) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// --- COMPONENTE PUBLICROUTE (sin cambios) ---
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  console.log('[AppRoutes] Ruta actual:', location.pathname);
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- ESTRUCTURA DE RUTAS PROTEGIDAS ACTUALIZADA --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Rutas generales del dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* --- RUTA DE REPORTES CON LA PÁGINA DEL CATÁLOGO (CORREGIDA) --- */}
          {/* 
            ANTES: <Route path="/inventario/catalogo" element={<ProductCatalogPage />} />
            AHORA:
          */}
          <Route path="/reportes/catalogo" element={<ProductCatalogPage />} />
          {/* En el futuro, aquí añadirás más rutas de reportes */}
          {/* <Route path="/reportes/ventas" element={<PaginaReporteVentas />} /> */}


          {/* --- RUTA DE ADMINISTRACIÓN CON PROTECCIÓN POR ROL --- */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
            <Route path="/admin/usuarios" element={<UserManagementPage />} />
            {/* Aquí puedes añadir más rutas que solo los administradores puedan ver */}
          </Route>
          
          {/* Aquí irán las otras rutas (ventas, finanzas, etc.) */}
        </Route>
      </Route>
      
      {/* La regla "catch-all" que te estaba redirigiendo */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;