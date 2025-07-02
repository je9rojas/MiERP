import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Importaciones directas para máxima confiabilidad
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';

console.log('[AppRoutes] Configurando rutas');

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  console.log('[ProtectedRoute] Verificando acceso', {
    autenticado: isAuthenticated,
    cargando: isLoading,
    ruta: location.pathname
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  console.log('[PublicRoute] Verificando acceso', {
    autenticado: isAuthenticated,
    cargando: isLoading,
    ruta: location.pathname
  });
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace state={{ from: location }} />;
};

const AppRoutes = () => {
  const location = useLocation();
  console.log('[AppRoutes] Ruta actual:', location.pathname);
  
  return (
    <Routes>
      {/* Ruta pública principal */}
      <Route path="/" element={<HomePage />} />

      {/* Rutas públicas para no autenticados */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* Rutas protegidas para autenticados */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
      
      {/* Manejo de rutas no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;